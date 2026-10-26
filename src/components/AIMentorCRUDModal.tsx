import React, { useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Database,
  PlusCircle,
  Edit3,
  Trash2,
  X,
  Lock,
} from 'lucide-react';
import {
  MajorItem,
  PAOItem,
  MemoryPalace,
  PegShapeItem,
  BodyPegItem,
  PersonFaceCard,
  AbstractShapeCard,
  AcademicKeyPoint,
  PersonalContactAssociation,
} from '../types/memory';
import { db, collection, getDocs, query, where } from '../lib/firebase';
import { DEFAULT_MAJOR_00_99 } from '../data/defaultAssociations';

export type PersonalAssociation = PersonalContactAssociation;

export interface AIMentorDatabaseSnapshot {
  userUid: string;
  userName: string;
  userEmail?: string | null;
  isAuthenticated: boolean;
  majorDigits: MajorItem[];
  connectingLetters: string[];
  majorItems: MajorItem[];
  paoItems: PAOItem[];
  palaces: MemoryPalace[];
  shapePegs: PegShapeItem[];
  bodyPegs: BodyPegItem[];
  peopleCards: PersonFaceCard[];
  abstractShapes: AbstractShapeCard[];
  academicPoints: AcademicKeyPoint[];
  personalAssociations: PersonalContactAssociation[];
}

const DEFAULT_MAJOR_MAP = new Map<number, string>(
  DEFAULT_MAJOR_00_99.map((item) => [item.number, item.defaultWord])
);

/**
 * Fetches the authenticated user's latest records from Firestore (if online) and merges
 * them with the current in-memory userDatabase snapshot, while stripping base64 imageUrl/avatarUrl
 * strings so the payload sent to /api/gemini/mentor-chat is fast, lightweight, and 100% accurate.
 */
export async function fetchAndSanitizeUserDatabaseForMentor(
  snapshot?: AIMentorDatabaseSnapshot
): Promise<any> {
  if (!snapshot) return {};

  const majorMap = new Map<number, any>();
  for (const item of snapshot.majorItems || []) {
    if (typeof item?.number === 'number' && !isNaN(item.number)) {
      majorMap.set(item.number, {
        number: item.number,
        numberStr: item.numberStr || (item.number < 10 ? `0${item.number}` : String(item.number)),
        consonants: item.consonants || '',
        defaultWord: item.defaultWord || '',
        imageHint: item.imageHint || '',
        customNotes: item.customNotes || '',
        is_ready_for_practice: Boolean(item.is_ready_for_practice),
      });
    }
  }

  const paoMap = new Map<number, any>();
  for (const item of snapshot.paoItems || []) {
    if (typeof item?.number === 'number' && !isNaN(item.number)) {
      paoMap.set(item.number, {
        number: item.number,
        numberStr: item.numberStr || (item.number < 10 ? `0${item.number}` : String(item.number)),
        person: item.person || '',
        action: item.action || '',
        object: item.object || '',
        scene: item.scene || '',
        is_ready_for_practice: Boolean(item.is_ready_for_practice),
      });
    }
  }

  // Query live Firestore with a 2.5s timeout to ensure any direct DB / Rowy / user-branch updates are reflected
  try {
    const uid = snapshot.isAuthenticated && snapshot.userUid && snapshot.userUid !== 'local-user'
      ? snapshot.userUid
      : null;

    const fetchWithTimeout = <T,>(p: Promise<T>, ms = 2500): Promise<T | null> =>
      Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

    const [majorSnap, paoSnap] = await Promise.all([
      fetchWithTimeout(
        uid
          ? getDocs(query(collection(db, 'major_items'), where('userId', '==', uid)))
          : getDocs(collection(db, 'major_items'))
      ),
      fetchWithTimeout(
        uid
          ? getDocs(query(collection(db, 'pao_items'), where('userId', '==', uid)))
          : getDocs(collection(db, 'pao_items'))
      ),
    ]);

    // Also check root major_items if user is authenticated in case edits were made on root docs in Rowy/Firestore
    const rootMajorSnap = uid
      ? await fetchWithTimeout(getDocs(where('isDefault', '==', true) ? collection(db, 'major_items') : collection(db, 'major_items')), 2000)
      : null;

    const applyMajorDoc = (data: any, docId: string, isUserDoc: boolean) => {
      if (!data || docId === 'NaN' || docId === 'nan') return;
      const rawId = data.rawId || (docId.includes('_') ? docId.split('_').pop() : docId);
      const num = typeof data.number === 'number' ? data.number : parseInt(String(data.numberStr || rawId), 10);
      if (isNaN(num) || num < 0 || num > 99) return;
      const word = data.defaultWord && data.defaultWord !== 'null' ? String(data.defaultWord).trim() : '';
      if (!word) return;

      const existing = majorMap.get(num);
      const defaultStaticWord = DEFAULT_MAJOR_MAP.get(num);
      // Prefer user-owned document, or any document that has been customized away from static baseline
      if (
        isUserDoc ||
        !existing ||
        (word !== defaultStaticWord && existing.defaultWord === defaultStaticWord)
      ) {
        majorMap.set(num, {
          number: num,
          numberStr: (num < 10 ? `0${num}` : String(num)).padStart(2, '0'),
          consonants: data.consonants || existing?.consonants || '',
          defaultWord: word,
          imageHint: data.imageHint || existing?.imageHint || '',
          customNotes: data.customNotes || existing?.customNotes || '',
          is_ready_for_practice: Boolean(data.is_ready_for_practice ?? existing?.is_ready_for_practice),
        });
      }
    };

    if (rootMajorSnap) {
      rootMajorSnap.forEach((d) => {
        const data = d.data();
        const isCurrentUsersDoc = uid && (d.id.startsWith(`${uid}_`) || data.userId === uid);
        const isRootDoc = !d.id.includes('_');
        if (isCurrentUsersDoc || isRootDoc) {
          applyMajorDoc(data, d.id, Boolean(isCurrentUsersDoc));
        }
      });
    }

    if (majorSnap) {
      majorSnap.forEach((d) => {
        applyMajorDoc(d.data(), d.id, true);
      });
    }

    if (paoSnap) {
      paoSnap.forEach((d) => {
        const data = d.data();
        if (!data || d.id === 'NaN' || d.id === 'nan') return;
        const rawId = data.rawId || (d.id.includes('_') ? d.id.split('_').pop() : d.id);
        const num = typeof data.number === 'number' ? data.number : parseInt(String(data.numberStr || rawId), 10);
        if (isNaN(num) || num < 0 || num > 99) return;
        paoMap.set(num, {
          number: num,
          numberStr: (num < 10 ? `0${num}` : String(num)).padStart(2, '0'),
          person: data.person || '',
          action: data.action || '',
          object: data.object || '',
          scene: data.scene || '',
          is_ready_for_practice: Boolean(data.is_ready_for_practice),
        });
      });
    }
  } catch (err) {
    console.warn('Firestore live query in AI Mentor fell back to in-memory state:', err);
  }

  return {
    userUid: snapshot.userUid,
    userName: snapshot.userName,
    isAuthenticated: snapshot.isAuthenticated,
    connectingLetters: snapshot.connectingLetters || [],
    majorDigits: (snapshot.majorDigits || []).map((d) => ({
      number: d.number,
      consonants: d.consonants,
      defaultWord: d.defaultWord,
      imageHint: d.imageHint,
    })),
    majorItems: Array.from(majorMap.values()).sort((a, b) => a.number - b.number),
    paoItems: Array.from(paoMap.values()).sort((a, b) => a.number - b.number),
    palaces: (snapshot.palaces || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      loci: (p.loci || []).map((l) => ({
        id: l.id,
        stepNumber: l.stepNumber,
        roomName: l.roomName,
        title: l.title,
        positionDescription: l.positionDescription,
        storedContent: l.storedContent,
        mnemonicScene: l.mnemonicScene,
      })),
    })),
    shapePegs: (snapshot.shapePegs || []).map((s) => ({
      number: s.number,
      shapeName: s.shapeName,
      defaultObject: s.defaultObject,
      kineticTip: s.kineticTip,
    })),
    bodyPegs: (snapshot.bodyPegs || []).map((b) => ({
      index: b.index,
      bodyPartHebrew: b.bodyPartHebrew,
      defaultObject: b.defaultObject,
      kineticTip: b.kineticTip,
    })),
    peopleCards: (snapshot.peopleCards || []).map((c) => ({
      id: c.id,
      name: c.name,
      roleOrJob: c.roleOrJob,
      morphologicalAnchor: c.morphologicalAnchor,
      substituteWord: c.substituteWord,
      mnemonicScene: c.mnemonicScene,
    })),
    academicPoints: (snapshot.academicPoints || []).map((a) => ({
      id: a.id,
      conceptTitle: a.conceptTitle,
      discipline: a.discipline,
      keyWord: a.keyWord,
      visualAnchor: a.visualAnchor,
      mnemonicScene: a.mnemonicScene,
    })),
    personalAssociations: (snapshot.personalAssociations || []).map((pa) => ({
      id: pa.id,
      targetSubject: pa.targetSubject,
      storedNumberOrFact: pa.storedNumberOrFact,
      encodedMnemonic: pa.encodedMnemonic,
      methodUsed: pa.methodUsed,
    })),
  };
}

export interface AIMentorCRUDHandlers {
  // Major 0-9 Logic
  onUpdateMajorDigit?: (digit: number, consonants: string, word?: string, hint?: string) => void;
  onUpdateConnectingLetters?: (letters: string[]) => void;
  // Major 00-99
  onAddMajorItem?: (item: MajorItem) => void;
  onUpdateMajorItem?: (
    number: number,
    updates: {
      defaultWord?: string;
      consonants?: string;
      imageHint?: string;
      customNotes?: string;
      is_ready_for_practice?: boolean;
    }
  ) => void;
  onDeleteMajorItem?: (number: number) => void;
  // PAO 00-99
  onAddPAOItem?: (item: PAOItem) => void;
  onUpdatePAOItem?: (
    number: number,
    updates: {
      person?: string;
      action?: string;
      object?: string;
      scene?: string;
      is_ready_for_practice?: boolean;
    }
  ) => void;
  onDeletePAOItem?: (number: number) => void;
  // Memory Palaces & Loci
  onAddPalace?: (name: string, description: string, category?: 'home' | 'familiar_route' | 'custom') => void;
  onUpdatePalace?: (palaceId: string, updates: { name?: string; description?: string; category?: 'home' | 'familiar_route' | 'custom' }) => void;
  onDeletePalace?: (palaceId: string) => void;
  onAddLocus?: (
    palaceId: string,
    locus: {
      title: string;
      roomName: string;
      positionDescription?: string;
      storedContent?: string;
      mnemonicScene?: string;
    }
  ) => void;
  onUpdateLocus?: (
    palaceId: string,
    locusId: string,
    updates: {
      title?: string;
      roomName?: string;
      positionDescription?: string;
      storedContent?: string;
      mnemonicScene?: string;
      is_ready_for_practice?: boolean;
    }
  ) => void;
  onDeleteLocus?: (palaceId: string, locusId: string) => void;
  // Names & Faces
  onAddPersonFaceCard?: (card: Omit<PersonFaceCard, 'id'>) => void;
  onUpdatePersonFaceCard?: (id: string, updates: Partial<PersonFaceCard>) => void;
  onDeletePersonFaceCard?: (id: string) => void;
  // Shape & Body Pegs
  onAddShapePeg?: (item: PegShapeItem) => void;
  onUpdateShapePeg?: (
    number: number,
    updates: { defaultObject?: string; shapeName?: string; kineticTip?: string; is_ready_for_practice?: boolean }
  ) => void;
  onDeleteShapePeg?: (number: number) => void;
  onAddBodyPeg?: (item: BodyPegItem) => void;
  onUpdateBodyPeg?: (
    step: number,
    updates: { defaultObject?: string; bodyPartHebrew?: string; kineticTip?: string; is_ready_for_practice?: boolean }
  ) => void;
  onDeleteBodyPeg?: (step: number) => void;
  // Academic Points
  onAddAcademicPoint?: (point: any) => void;
  onUpdateAcademicPoint?: (id: string, updates: Partial<AcademicKeyPoint>) => void;
  onDeleteAcademicPoint?: (id: string) => void;
  // Personal Associations
  onAddAssociation?: (assoc: any) => void;
  onUpdateAssociation?: (id: string, updates: Partial<PersonalAssociation>) => void;
  onDeleteAssociation?: (id: string) => void;
}

export interface PendingCRUDAction {
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  type: string;
  targetLabel?: string;
  summary?: string;
  payload: Record<string, any>;
}

export function normalizeCRUDAction(rawAction: any): PendingCRUDAction | null {
  if (!rawAction || typeof rawAction !== 'object' || !rawAction.type) return null;
  const type = String(rawAction.type).toUpperCase().trim();
  const payload = rawAction.payload && typeof rawAction.payload === 'object' ? rawAction.payload : {};

  let operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' = 'UPDATE';
  if (rawAction.operation && ['CREATE', 'UPDATE', 'DELETE', 'READ'].includes(String(rawAction.operation).toUpperCase())) {
    operation = String(rawAction.operation).toUpperCase() as any;
  } else if (type.startsWith('DELETE_')) {
    operation = 'DELETE';
  } else if (type.startsWith('CREATE_') || type.startsWith('ADD_')) {
    operation = 'CREATE';
  } else if (type.startsWith('READ_')) {
    operation = 'READ';
  }

  return {
    operation,
    type,
    targetLabel: rawAction.targetLabel,
    summary: rawAction.summary,
    payload,
  };
}

export function describeCRUDAction(action: PendingCRUDAction): {
  operationBadge: string;
  moduleTitle: string;
  description: string;
  details: Array<{ label: string; value: string }>;
} {
  const { operation, type, payload, summary, targetLabel } = action;
  const opBadge =
    operation === 'CREATE'
      ? 'יצירת רשומה חדשה (CREATE)'
      : operation === 'DELETE'
      ? 'מחיקת רשומה (DELETE)'
      : 'עדכון רשומה קיימת (UPDATE)';

  const details: Array<{ label: string; value: string }> = [];

  if (payload.number !== undefined) {
    details.push({ label: 'מספר יעד', value: String(payload.number) });
  }
  if (payload.digit !== undefined) {
    details.push({ label: 'ספרה (0-9)', value: String(payload.digit) });
  }
  if (payload.consonants) {
    details.push({ label: 'עיצורים מותרים', value: String(payload.consonants) });
  }
  if (payload.defaultWord || payload.userWord) {
    details.push({ label: 'מילת עוגן (Major)', value: String(payload.defaultWord || payload.userWord) });
  }
  if (payload.person || payload.userPerson) {
    details.push({ label: 'אדם (Person)', value: String(payload.person || payload.userPerson) });
  }
  if (payload.action || payload.userAction) {
    details.push({ label: 'פעולה (Action)', value: String(payload.action || payload.userAction) });
  }
  if (payload.object || payload.userObject) {
    details.push({ label: 'חפץ (Object)', value: String(payload.object || payload.userObject) });
  }
  if (payload.scene || payload.mnemonicScene || payload.kineticScene) {
    details.push({
      label: 'סצנה מנמונית',
      value: String(payload.scene || payload.mnemonicScene || payload.kineticScene),
    });
  }
  if (payload.name || payload.conceptName || payload.title || payload.targetSubject || payload.sourceKey) {
    details.push({
      label: 'שם / כותרת',
      value: String(
        payload.name || payload.conceptName || payload.title || payload.targetSubject || payload.sourceKey
      ),
    });
  }
  if (payload.roomName) {
    details.push({ label: 'חדר / אזור בארמון', value: String(payload.roomName) });
  }
  if (payload.description || payload.positionDescription || payload.coreDefinition) {
    details.push({
      label: 'תיאור / תוכן',
      value: String(payload.description || payload.positionDescription || payload.coreDefinition),
    });
  }
  if (payload.storedNumberOrFact || payload.targetValue || payload.storedContent) {
    details.push({
      label: 'מידע שמור',
      value: String(payload.storedNumberOrFact || payload.targetValue || payload.storedContent),
    });
  }

  let moduleTitle = targetLabel || 'מסד הנתונים של המשתמש';
  if (type.includes('MAJOR')) moduleTitle = 'מודולת Major (00-99)';
  else if (type.includes('PAO')) moduleTitle = 'מודולת PAO (00-99)';
  else if (type.includes('DIGIT') || type.includes('CONNECTING')) moduleTitle = 'מודולת לוגיקת מספרים (0-9)';
  else if (type.includes('PALACE')) moduleTitle = 'מודולת ארמונות זיכרון';
  else if (type.includes('LOCUS')) moduleTitle = 'תחנה (Locus) בארמון זיכרון';
  else if (type.includes('PERSON')) moduleTitle = 'מודולת שמות ופנים';
  else if (type.includes('PEG')) moduleTitle = 'מודולת מתלי צורה וגוף';
  else if (type.includes('ACADEMIC')) moduleTitle = 'מודולת חומרים אקדמיים';
  else if (type.includes('ASSOCIATION')) moduleTitle = 'פנקס אסוציאציות אישי';

  const defaultDesc =
    summary ||
    `מנטור ה-AI מבקש לבצע פעולת ${
      operation === 'CREATE' ? 'יצירה' : operation === 'DELETE' ? 'מחיקה' : 'עדכון'
    } ב-${moduleTitle}.`;

  return {
    operationBadge: opBadge,
    moduleTitle,
    description: defaultDesc,
    details,
  };
}

export function executeAIMentorCRUDAction(
  action: PendingCRUDAction,
  handlers: AIMentorCRUDHandlers,
  userDatabase?: AIMentorDatabaseSnapshot
): string {
  const { type, payload } = action;
  const t = type.toUpperCase();

  // 1. MAJOR 00-99
  if ((t === 'UPDATE_MAJOR' || t === 'CREATE_MAJOR') && payload.number !== undefined) {
    const num = Number(payload.number);
    const word = payload.defaultWord || payload.userWord;
    const hint = payload.imageHint || payload.userImageHint;
    const existing = userDatabase?.majorItems.some((m) => m.number === num);
    if (!existing && t === 'CREATE_MAJOR' && handlers.onAddMajorItem) {
      handlers.onAddMajorItem({
        number: num,
        displayNumber: num < 10 ? `0${num}` : String(num),
        consonants: payload.consonants || '',
        defaultWord: word || 'חפץ חדש',
        imageHint: hint || '',
        customNotes: payload.customNotes || '',
        is_ready_for_practice: true,
      });
      return `⚡ נוצר בהצלחה ערך Major חדש עבור המספר ${num}!`;
    }
    handlers.onUpdateMajorItem?.(num, {
      defaultWord: word,
      imageHint: hint,
      customNotes: payload.customNotes,
    });
    return `⚡ עודכנה בהצלחה מילת העוגן ב-Major עבור המספר ${num}!`;
  }

  if (t === 'DELETE_MAJOR' && payload.number !== undefined) {
    const num = Number(payload.number);
    handlers.onDeleteMajorItem?.(num);
    return `🗑️ נמחקה בהצלחה רשומת Major עבור המספר ${num}.`;
  }

  // 2. PAO 00-99
  if ((t === 'UPDATE_PAO' || t === 'CREATE_PAO') && payload.number !== undefined) {
    const num = Number(payload.number);
    const person = payload.person || payload.userPerson;
    const act = payload.action || payload.userAction;
    const obj = payload.object || payload.userObject;
    const scene = payload.scene || payload.mnemonicScene;
    const existing = userDatabase?.paoItems.some((p) => p.number === num);
    if (!existing && t === 'CREATE_PAO' && handlers.onAddPAOItem) {
      handlers.onAddPAOItem({
        number: num,
        displayNumber: num < 10 ? `0${num}` : String(num),
        consonants: payload.consonants || '',
        person: person || 'דמות',
        action: act || 'פעולה',
        object: obj || 'חפץ',
        scene: scene || `${person || 'דמות'} ${act || 'פעולה'} ${obj || 'חפץ'}`,
        is_ready_for_practice: true,
      });
      return `⚡ נוצרה בהצלחה שלשת PAO חדשה עבור המספר ${num}!`;
    }
    handlers.onUpdatePAOItem?.(num, {
      person,
      action: act,
      object: obj,
      scene,
    });
    return `⚡ עודכנה בהצלחה שלשת PAO עבור המספר ${num}!`;
  }

  if (t === 'DELETE_PAO' && payload.number !== undefined) {
    const num = Number(payload.number);
    handlers.onDeletePAOItem?.(num);
    return `🗑️ נמחקה בהצלחה שלשת PAO עבור המספר ${num}.`;
  }

  // 3. DIGIT LOGIC (0-9) & CONNECTING LETTERS
  if (t === 'UPDATE_DIGIT_LOGIC' && payload.digit !== undefined && payload.consonants) {
    handlers.onUpdateMajorDigit?.(Number(payload.digit), String(payload.consonants));
    return `⚡ עודכנו בהצלחה העיצורים של הספרה ${payload.digit} במודולת לוגיקת המספרים!`;
  }

  if (t === 'UPDATE_CONNECTING_LETTERS' && Array.isArray(payload.letters)) {
    handlers.onUpdateConnectingLetters?.(payload.letters.map(String));
    return `⚡ עודכנו בהצלחה אותיות הקישור במודולת לוגיקת המספרים!`;
  }

  // 4. MEMORY PALACES & LOCI
  if ((t === 'ADD_PALACE' || t === 'CREATE_PALACE') && payload.name) {
    handlers.onAddPalace?.(
      String(payload.name),
      String(payload.description || 'ארמון זיכרון שנוצר על ידי מנטור ה-AI'),
      (payload.category as any) || 'custom'
    );
    return `⚡ נוצר בהצלחה ארמון זיכרון חדש: "${payload.name}"!`;
  }

  if (t === 'UPDATE_PALACE' && payload.palaceId) {
    handlers.onUpdatePalace?.(String(payload.palaceId), {
      name: payload.name,
      description: payload.description,
      category: payload.category,
    });
    return `⚡ עודכנו בהצלחה פרטי ארמון הזיכרון!`;
  }

  if (t === 'DELETE_PALACE') {
    const targetPalaceId =
      payload.palaceId ||
      userDatabase?.palaces.find((p) => p.name === payload.name)?.id;
    if (targetPalaceId) {
      handlers.onDeletePalace?.(String(targetPalaceId));
      return `🗑️ נמחק בהצלחה ארמון הזיכרון "${payload.name || targetPalaceId}".`;
    }
  }

  if (t === 'ADD_LOCUS' || t === 'CREATE_LOCUS') {
    const targetPalaceId =
      payload.palaceId ||
      userDatabase?.palaces.find((p) => p.name === payload.palaceName)?.id ||
      userDatabase?.palaces[0]?.id;
    if (targetPalaceId) {
      handlers.onAddLocus?.(String(targetPalaceId), {
        title: payload.title || 'תחנה חדשה',
        roomName: payload.roomName || 'חדר ראשי',
        positionDescription: payload.positionDescription || '',
        storedContent: payload.storedContent || payload.mnemonicScene || '',
        mnemonicScene: payload.mnemonicScene || '',
      });
      return `⚡ נוספה בהצלחה תחנה חדשה ("${payload.title || 'תחנה חדשה'}") בארמון הזיכרון!`;
    }
  }

  if (t === 'UPDATE_LOCUS' && payload.palaceId && payload.locusId) {
    handlers.onUpdateLocus?.(String(payload.palaceId), String(payload.locusId), {
      title: payload.title,
      roomName: payload.roomName,
      positionDescription: payload.positionDescription,
      storedContent: payload.storedContent,
      mnemonicScene: payload.mnemonicScene,
    });
    return `⚡ עודכנה בהצלחה התחנה בארמון הזיכרון!`;
  }

  if (t === 'DELETE_LOCUS' && payload.palaceId && payload.locusId) {
    handlers.onDeleteLocus?.(String(payload.palaceId), String(payload.locusId));
    return `🗑️ נמחקה בהצלחה התחנה מארמון הזיכרון.`;
  }

  // 5. NAMES & FACES
  if ((t === 'CREATE_PERSON_CARD' || t === 'ADD_PERSON_CARD') && payload.name) {
    handlers.onAddPersonFaceCard?.({
      name: String(payload.name),
      roleOrContext: String(payload.roleOrContext || 'איש קשר'),
      prominentFacialFeature: String(payload.prominentFacialFeature || 'תו פנים בולט'),
      namePhoneticAnchor: String(payload.namePhoneticAnchor || payload.name),
      mnemonicScene: String(payload.mnemonicScene || ''),
      is_ready_for_practice: true,
    });
    return `⚡ נוסף בהצלחה כרטיס שם ופנים עבור "${payload.name}"!`;
  }

  if (t === 'UPDATE_PERSON_CARD' && payload.id) {
    handlers.onUpdatePersonFaceCard?.(String(payload.id), payload);
    return `⚡ עודכן בהצלחה כרטיס השם והפנים!`;
  }

  if (t === 'DELETE_PERSON_CARD') {
    const targetId =
      payload.id ||
      userDatabase?.peopleCards.find((c) => c.name === payload.name)?.id;
    if (targetId) {
      handlers.onDeletePersonFaceCard?.(String(targetId));
      return `🗑️ נמחק בהצלחה כרטיס השם והפנים.`;
    }
  }

  // 6. SHAPE & BODY PEGS
  if ((t === 'UPDATE_SHAPE_PEG' || t === 'CREATE_SHAPE_PEG') && payload.number !== undefined) {
    handlers.onUpdateShapePeg?.(Number(payload.number), {
      shapeName: payload.shapeName,
      defaultObject: payload.defaultObject,
      kineticTip: payload.kineticTip,
    });
    return `⚡ עודכן בהצלחה מתלה הצורה מספר ${payload.number}!`;
  }

  if (t === 'DELETE_SHAPE_PEG' && payload.number !== undefined) {
    handlers.onDeleteShapePeg?.(Number(payload.number));
    return `🗑️ נמחק בהצלחה מתלה הצורה מספר ${payload.number}.`;
  }

  if ((t === 'UPDATE_BODY_PEG' || t === 'CREATE_BODY_PEG') && payload.step !== undefined) {
    handlers.onUpdateBodyPeg?.(Number(payload.step), {
      bodyPartHebrew: payload.bodyPartHebrew,
      defaultObject: payload.defaultObject,
      kineticTip: payload.kineticTip,
    });
    return `⚡ עודכן בהצלחה מתלה הגוף שלב ${payload.step}!`;
  }

  if (t === 'DELETE_BODY_PEG' && payload.step !== undefined) {
    handlers.onDeleteBodyPeg?.(Number(payload.step));
    return `🗑️ נמחק בהצלחה מתלה הגוף שלב ${payload.step}.`;
  }

  // 7. ACADEMIC POINTS
  if ((t === 'ADD_ACADEMIC' || t === 'CREATE_ACADEMIC') && (payload.conceptName || payload.conceptTitle)) {
    handlers.onAddAcademicPoint?.({
      courseOrTopic: payload.courseOrTopic || payload.discipline || 'לימודים אקדמיים',
      conceptName: payload.conceptName || payload.conceptTitle,
      coreDefinition: payload.coreDefinition || payload.sourceSummary || '',
      phoneticAnchor: payload.phoneticAnchor || payload.keyWord || '',
      visualTranslation: payload.visualTranslation || payload.visualAnchor || '',
      kineticScene: payload.kineticScene || payload.mnemonicScene || '',
    });
    return `⚡ נוסף בהצלחה מושג אקדמי חדש: "${payload.conceptName || payload.conceptTitle}"!`;
  }

  if (t === 'UPDATE_ACADEMIC' && payload.id) {
    handlers.onUpdateAcademicPoint?.(String(payload.id), payload);
    return `⚡ עודכן בהצלחה המושג האקדמי!`;
  }

  if (t === 'DELETE_ACADEMIC' && payload.id) {
    handlers.onDeleteAcademicPoint?.(String(payload.id));
    return `🗑️ נמחק בהצלחה המושג האקדמי.`;
  }

  // 8. PERSONAL ASSOCIATIONS
  if (
    (t === 'ADD_ASSOCIATION' || t === 'CREATE_ASSOCIATION') &&
    (payload.targetSubject || payload.sourceKey)
  ) {
    handlers.onAddAssociation?.({
      targetSubject: payload.targetSubject || payload.sourceKey,
      storedNumberOrFact: payload.storedNumberOrFact || payload.targetValue || '',
      encodedMnemonic: payload.encodedMnemonic || payload.kineticScene || payload.mnemonicScene || '',
      methodUsed: payload.methodUsed || 'major',
    });
    return `⚡ נוספה בהצלחה אסוציאציה חדשה לפנקס האישי!`;
  }

  if (t === 'UPDATE_ASSOCIATION' && payload.id) {
    handlers.onUpdateAssociation?.(String(payload.id), payload);
    return `⚡ עודכנה בהצלחה האסוציאציה בפנקס האישי!`;
  }

  if (t === 'DELETE_ASSOCIATION' && payload.id) {
    handlers.onDeleteAssociation?.(String(payload.id));
    return `🗑️ נמחקה בהצלחה האסוציאציה מהפנקס האישי.`;
  }

  return '⚡ הפעולה אושרה ובוצעה בהצלחה במסד הנתונים!';
}

interface AIMentorCRUDConfirmationModalProps {
  pendingAction: PendingCRUDAction | null;
  userName?: string;
  onApprove: () => void;
  onCancel: () => void;
}

export const AIMentorCRUDConfirmationModal: React.FC<AIMentorCRUDConfirmationModalProps> = ({
  pendingAction,
  userName,
  onApprove,
  onCancel,
}) => {
  useEffect(() => {
    if (!pendingAction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingAction, onCancel]);

  if (!pendingAction) return null;

  const info = describeCRUDAction(pendingAction);
  const isDelete = pendingAction.operation === 'DELETE';
  const isCreate = pendingAction.operation === 'CREATE';

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      dir="rtl"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-xl bg-white border-2 border-slate-300 border-b-8 border-b-slate-400 rounded-3xl shadow-2xl overflow-hidden text-slate-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b-2 flex items-center justify-between ${
            isDelete
              ? 'bg-rose-50 border-rose-200'
              : isCreate
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 shadow-2xs ${
                isDelete
                  ? 'bg-rose-100 border-rose-300 text-rose-700'
                  : isCreate
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}
            >
              {isDelete ? (
                <Trash2 className="w-5 h-5" />
              ) : isCreate ? (
                <PlusCircle className="w-5 h-5" />
              ) : (
                <Edit3 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    isDelete
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : isCreate
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {info.operationBadge}
                </span>
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>נתוני משתמש: {userName || 'משתמש מחובר'}</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                אישור ביצוע שינוי במסד הנתונים על ידי מנטור ה-AI
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer"
            title="בטל וסגור (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
            <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-extrabold text-slate-900">
                יעד הפעולה: <span className="text-indigo-700">{info.moduleTitle}</span>
              </p>
              <p className="text-slate-700 leading-relaxed font-medium">{info.description}</p>
            </div>
          </div>

          {/* Field Details Preview */}
          {info.details.length > 0 && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 uppercase">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>פירוט הנתונים לביצוע בפעולה זו:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {info.details.map((d, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <span className="text-[10px] font-bold text-slate-500 block">{d.label}</span>
                    <span className="font-black text-slate-900 break-words">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 font-semibold text-center">
            פעולות יצירה, עדכון ומחיקה במסד הנתונים מושהות ודורשות את אישורך המפורש לפני ביצוע.
          </p>
        </div>

        {/* Modal Footer: Explicit Approve / Cancel Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-2 border-slate-300 hover:border-rose-300 font-black text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>בטל פעולה (Cancel)</span>
          </button>

          <button
            type="button"
            onClick={onApprove}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700 border-b-4 border-rose-800'
                : 'bg-[#58CC02] hover:bg-[#46a302] border-b-4 border-[#3a8702]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>אשר ובצע (Approve)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
