import {
  db,
  collection,
  doc,
  getDocs,
  writeBatch,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  cleanForFirestore,
  query,
  where,
  limit,
} from './firebase';
import {
  MajorItem,
  PAOItem,
  PegShapeItem,
  BodyPegItem,
  MemoryPalace,
  PersonFaceCard,
  AbstractShapeCard,
  PersonalContactAssociation,
  AcademicKeyPoint,
} from '../types/memory';
import {
  DEFAULT_MAJOR_DIGITS,
  DEFAULT_MAJOR_00_99,
  DEFAULT_PAO_ITEMS,
  DEFAULT_NUMBER_SHAPE_PEGS,
  DEFAULT_BODY_PEGS,
  DEFAULT_PALACES,
  DEFAULT_PEOPLE_CARDS,
  DEFAULT_ABSTRACT_SHAPES,
  DEFAULT_ACADEMIC_POINTS,
  DEFAULT_PERSONAL_ASSOCIATIONS,
} from '../data/defaultAssociations';

export interface SyncStats {
  uploaded: number;
  downloaded: number;
  collectionsUpdated: string[];
}

export interface SyncResult {
  success: boolean;
  message: string;
  stats?: SyncStats;
  mergedData?: {
    majorDigits: MajorItem[];
    majorItems: MajorItem[];
    paoItems: PAOItem[];
    shapePegs: PegShapeItem[];
    bodyPegs: BodyPegItem[];
    palaces: MemoryPalace[];
    peopleCards: PersonFaceCard[];
    abstractShapes: AbstractShapeCard[];
    academicPoints: AcademicKeyPoint[];
    personalAssociations: PersonalContactAssociation[];
  };
}

/**
 * Checks if the browser is currently online
 */
export function isNetworkOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Populate all default collections in Firestore if empty or on user request.
 * Creates clean individual documents so Rowy and Firebase Console show full tables and rows.
 */
export async function seedAllDefaultsToFirestore(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    let totalCount = 0;
    const now = Date.now();

    // 1. Major 00-99 (100 rows)
    const majorBatch = writeBatch(db);
    for (const item of DEFAULT_MAJOR_00_99) {
      const docId = item.numberStr.padStart(2, '0');
      const docRef = doc(db, 'major_items', docId);
      majorBatch.set(docRef, {
        id: docId,
        rawId: docId,
        number: item.number,
        numberStr: item.numberStr,
        consonants: item.consonants,
        defaultWord: item.defaultWord,
        imageHint: item.imageHint,
        customNotes: item.customNotes || null,
        is_ready_for_practice: item.is_ready_for_practice ?? false,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }
    await majorBatch.commit();

    // 2. PAO 00-99 (100 rows)
    const paoBatch = writeBatch(db);
    for (const item of DEFAULT_PAO_ITEMS) {
      const docId = item.numberStr.padStart(2, '0');
      const docRef = doc(db, 'pao_items', docId);
      paoBatch.set(docRef, {
        id: docId,
        rawId: docId,
        number: item.number,
        numberStr: item.numberStr,
        person: item.person,
        action: item.action,
        object: item.object,
        scene: item.scene || null,
        imageUrl: item.imageUrl || null,
        is_ready_for_practice: item.is_ready_for_practice ?? false,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }
    await paoBatch.commit();

    // 3. Pegs & Palaces in a single batch
    const itemsBatch = writeBatch(db);

    // Body Pegs 1-20
    for (const b of DEFAULT_BODY_PEGS) {
      const docId = String(b.index);
      const docRef = doc(db, 'body_pegs', docId);
      itemsBatch.set(docRef, {
        id: docId,
        rawId: docId,
        index: b.index,
        bodyPartHebrew: b.bodyPartHebrew,
        defaultObject: b.defaultObject,
        kineticTip: b.kineticTip,
        is_ready_for_practice: b.is_ready_for_practice ?? false,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Number Shape Pegs 0-9
    for (const s of DEFAULT_NUMBER_SHAPE_PEGS) {
      const docId = String(s.number);
      const docRef = doc(db, 'shape_pegs', docId);
      itemsBatch.set(docRef, {
        id: docId,
        rawId: docId,
        number: s.number,
        shapeName: s.shapeName,
        visualMetaphor: s.visualMetaphor,
        defaultObject: s.defaultObject,
        kineticTip: s.kineticTip,
        is_ready_for_practice: s.is_ready_for_practice ?? false,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Palaces
    for (const p of DEFAULT_PALACES) {
      const docRef = doc(db, 'palaces', p.id);
      itemsBatch.set(docRef, {
        ...p,
        id: p.id,
        rawId: p.id,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // People Cards
    for (const c of DEFAULT_PEOPLE_CARDS) {
      const docRef = doc(db, 'people_cards', c.id);
      itemsBatch.set(docRef, {
        ...c,
        id: c.id,
        rawId: c.id,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Abstract Shapes
    for (const a of DEFAULT_ABSTRACT_SHAPES) {
      const docRef = doc(db, 'abstract_shapes', a.id);
      itemsBatch.set(docRef, {
        ...a,
        id: a.id,
        rawId: a.id,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Academic Points
    for (const ap of DEFAULT_ACADEMIC_POINTS) {
      const docRef = doc(db, 'academic_points', ap.id);
      itemsBatch.set(docRef, {
        ...ap,
        id: ap.id,
        rawId: ap.id,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Personal Associations
    for (const pa of DEFAULT_PERSONAL_ASSOCIATIONS) {
      const docRef = doc(db, 'personal_associations', pa.id);
      itemsBatch.set(docRef, {
        ...pa,
        id: pa.id,
        rawId: pa.id,
        userId: 'system_default',
        isDefault: true,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    await itemsBatch.commit();

    return {
      success: true,
      message: `כל טבלאות ה-DB אותחלו בהצלחה בענן Firestore (${totalCount} רשומות)! כעת הן זמינות גם ב-Rowy.`,
      count: totalCount,
    };
  } catch (err: any) {
    console.error('Error seeding defaults to Firestore:', err);
    return {
      success: false,
      message: `שגיאה באכלוס טבלאות ענן: ${err?.message || err}`,
      count: 0,
    };
  }
}

/**
 * Initializes an isolated database branch for a specific user in Firestore.
 * Clones the baseline dataset into user-partitioned documents with composite IDs (${userId}_${rawId})
 * and tags them with userId, userEmail, isDefault: false.
 * Compatible with Rowy dashboard table filtering.
 */
export async function seedUserBranchFromDefaults(
  userId: string,
  userEmail?: string | null,
  initialData?: {
    majorItems?: MajorItem[];
    paoItems?: PAOItem[];
    bodyPegs?: BodyPegItem[];
    shapePegs?: PegShapeItem[];
    palaces?: MemoryPalace[];
    peopleCards?: PersonFaceCard[];
    abstractShapes?: AbstractShapeCard[];
    academicPoints?: AcademicKeyPoint[];
    personalAssociations?: PersonalContactAssociation[];
  }
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    let totalCount = 0;
    const now = Date.now();
    const email = userEmail || '';

    const majorSource = initialData?.majorItems && initialData.majorItems.length > 0
      ? initialData.majorItems
      : DEFAULT_MAJOR_00_99;
    const paoSource = initialData?.paoItems && initialData.paoItems.length > 0
      ? initialData.paoItems
      : DEFAULT_PAO_ITEMS;
    const bodySource = initialData?.bodyPegs && initialData.bodyPegs.length > 0
      ? initialData.bodyPegs
      : DEFAULT_BODY_PEGS;
    const shapeSource = initialData?.shapePegs && initialData.shapePegs.length > 0
      ? initialData.shapePegs
      : DEFAULT_NUMBER_SHAPE_PEGS;
    const palacesSource = initialData?.palaces && initialData.palaces.length > 0
      ? initialData.palaces
      : DEFAULT_PALACES;
    const peopleSource = initialData?.peopleCards && initialData.peopleCards.length > 0
      ? initialData.peopleCards
      : DEFAULT_PEOPLE_CARDS;
    const shapesSource = initialData?.abstractShapes && initialData.abstractShapes.length > 0
      ? initialData.abstractShapes
      : DEFAULT_ABSTRACT_SHAPES;
    const academicSource = initialData?.academicPoints && initialData.academicPoints.length > 0
      ? initialData.academicPoints
      : DEFAULT_ACADEMIC_POINTS;
    const personalSource = initialData?.personalAssociations && initialData.personalAssociations.length > 0
      ? initialData.personalAssociations
      : DEFAULT_PERSONAL_ASSOCIATIONS;

    // Batch 1: Major items (100 rows)
    const majorBatch = writeBatch(db);
    for (const item of majorSource) {
      const rawId = (item.number < 10 ? `0${item.number}` : String(item.number)).padStart(2, '0');
      const docId = `${userId}_${rawId}`;
      const docRef = doc(db, 'major_items', docId);
      majorBatch.set(docRef, cleanForFirestore({
        ...item,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: item.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }
    await majorBatch.commit();

    // Batch 2: PAO items (100 rows)
    const paoBatch = writeBatch(db);
    for (const item of paoSource) {
      const rawId = (item.number < 10 ? `0${item.number}` : String(item.number)).padStart(2, '0');
      const docId = `${userId}_${rawId}`;
      const docRef = doc(db, 'pao_items', docId);
      paoBatch.set(docRef, cleanForFirestore({
        ...item,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: item.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }
    await paoBatch.commit();

    // Batch 3: Pegs, Palaces, People, Shapes, Academic, Personal
    const remainingBatch = writeBatch(db);

    for (const b of bodySource) {
      const rawId = String(b.index);
      const docId = `${userId}_${rawId}`;
      remainingBatch.set(doc(db, 'body_pegs', docId), cleanForFirestore({
        ...b,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: b.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }

    for (const s of shapeSource) {
      const rawId = String(s.number);
      const docId = `${userId}_${rawId}`;
      remainingBatch.set(doc(db, 'shape_pegs', docId), cleanForFirestore({
        ...s,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: s.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }

    for (const p of palacesSource) {
      const rawId = p.id;
      const docId = `${userId}_${rawId}`;
      remainingBatch.set(doc(db, 'palaces', docId), cleanForFirestore({
        ...p,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: p.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }

    for (const pe of peopleSource) {
      const rawId = pe.id;
      const docId = `${userId}_${rawId}`;
      remainingBatch.set(doc(db, 'people_cards', docId), cleanForFirestore({
        ...pe,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: pe.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }

    for (const sh of shapesSource) {
      const rawId = sh.id;
      const docId = `${userId}_${rawId}`;
      remainingBatch.set(doc(db, 'abstract_shapes', docId), cleanForFirestore({
        ...sh,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: sh.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }

    for (const ac of academicSource) {
      const rawId = ac.id;
      const docId = `${userId}_${rawId}`;
      remainingBatch.set(doc(db, 'academic_points', docId), cleanForFirestore({
        ...ac,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: ac.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }

    for (const pa of personalSource) {
      const rawId = pa.id;
      const docId = `${userId}_${rawId}`;
      remainingBatch.set(doc(db, 'personal_associations', docId), cleanForFirestore({
        ...pa,
        id: docId,
        rawId,
        userId,
        userEmail: email,
        isDefault: false,
        updatedAt: pa.updatedAt || now,
      }), { merge: true });
      totalCount++;
    }

    await remainingBatch.commit();

    return {
      success: true,
      message: `מאגר נתונים אישי אותחל בהצלחה (${totalCount} רשומות)`,
      count: totalCount,
    };
  } catch (err: any) {
    console.error('Error seeding user branch:', err);
    return {
      success: false,
      message: `שגיאה באיתחול ענף נתונים אישי: ${err?.message || err}`,
      count: 0,
    };
  }
}

/**
 * Checks if a user already has an isolated database branch in Firestore.
 * If not, automatically provisions one populated with the baseline associations.
 */
export async function ensureUserBranchExists(
  userId: string,
  userEmail?: string | null,
  initialData?: {
    majorItems?: MajorItem[];
    paoItems?: PAOItem[];
    bodyPegs?: BodyPegItem[];
    shapePegs?: PegShapeItem[];
    palaces?: MemoryPalace[];
    peopleCards?: PersonFaceCard[];
    abstractShapes?: AbstractShapeCard[];
    academicPoints?: AcademicKeyPoint[];
    personalAssociations?: PersonalContactAssociation[];
  }
): Promise<{ seeded: boolean; message: string }> {
  try {
    const qPao = query(collection(db, 'pao_items'), where('userId', '==', userId), limit(1));
    const qMajor = query(collection(db, 'major_items'), where('userId', '==', userId), limit(1));
    const [snapPao, snapMajor] = await Promise.all([getDocs(qPao), getDocs(qMajor)]);
    if (!snapPao.empty && !snapMajor.empty) {
      return { seeded: false, message: 'הענף האישי קיים ומוכן' };
    }

    const res = await seedUserBranchFromDefaults(userId, userEmail, initialData);
    return { seeded: res.success, message: res.message };
  } catch (err: any) {
    console.error('Error ensuring user branch exists:', err);
    return { seeded: false, message: `שגיאה בבדיקת ענף נתונים: ${err?.message || err}` };
  }
}

/**
 * Safely extracts timestamp in milliseconds from numbers, Firestore Timestamps, ISO strings, etc.
 */
export function getTimestampMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val.toMillis === 'function') {
    try { return val.toMillis(); } catch { return 0; }
  }
  if (typeof val.seconds === 'number') return val.seconds * 1000;
  if (typeof val.toDate === 'function') {
    try { return val.toDate().getTime(); } catch { return 0; }
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Checks if meaningful content differ between local and remote items
 */
export function isItemDifferent(a: any, b: any): boolean {
  if (a === b) return false;
  if (!a || !b) return true;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (key === 'updatedAt' || key === '_updatedAt' || key === 'lastModified' || key === 'updated_at' || key === 'userId') {
      continue;
    }
    const valA = a[key] === undefined || a[key] === null ? null : a[key];
    const valB = b[key] === undefined || b[key] === null ? null : b[key];
    if (typeof valA === 'object' && typeof valB === 'object') {
      if (JSON.stringify(valA) !== JSON.stringify(valB)) return true;
    } else if (valA !== valB) {
      return true;
    }
  }
  return false;
}

/**
 * Efficiently merges remote collection items into the existing local collection
 * while preserving pending local offline edits.
 */
export function mergeWithRemoteItems<T extends { updatedAt?: number }>(
  prev: T[],
  remoteList: T[],
  getId: (item: T) => string
): T[] {
  if (!remoteList || remoteList.length === 0) return prev;

  const remoteMap = new Map<string, T>();
  for (const item of remoteList) {
    const id = getId(item);
    if (!id || id === 'NaN' || id === 'nan' || id === 'undefined' || id === 'null') continue;
    remoteMap.set(id, item);
  }

  let hasAnyChanges = false;
  const merged: T[] = [];
  const processedIds = new Set<string>();

  for (const prevItem of prev) {
    const id = getId(prevItem);
    if (!id || id === 'NaN' || id === 'nan' || id === 'undefined' || id === 'null') {
      hasAnyChanges = true;
      continue;
    }
    processedIds.add(id);
    const remoteItem = remoteMap.get(id);

    if (!remoteItem) {
      // Local item not present remotely - keep local item
      merged.push(prevItem);
    } else {
      const prevTime = getTimestampMillis(prevItem.updatedAt);
      const remoteTime = getTimestampMillis(remoteItem.updatedAt);
      const different = isItemDifferent(prevItem, remoteItem);

      if (different) {
        // Any difference arriving from Firestore (Rowy, Firebase Console, or other tabs)
        // must be accepted immediately without requiring updatedAt to be artificially higher.
        const prevImg = (prevItem as any).imageUrl;
        const remoteImg = (remoteItem as any).imageUrl;
        const finalImg = remoteImg !== undefined ? remoteImg : prevImg;

        merged.push({
          ...prevItem,
          ...remoteItem,
          ...(finalImg !== undefined ? { imageUrl: finalImg } : {}),
          updatedAt: Math.max(prevTime, remoteTime, Date.now()),
        });
        hasAnyChanges = true;
      } else {
        merged.push(prevItem);
      }
    }
  }

  // Remote items that don't exist locally yet
  for (const [id, remoteItem] of remoteMap.entries()) {
    if (!processedIds.has(id)) {
      merged.push(remoteItem);
      hasAnyChanges = true;
    }
  }

  return hasAnyChanges ? merged : prev;
}

/**
 * Generic Bidirectional Sync with Last-Write-Wins conflict resolution & Rowy _updatedAt support
 * Supports multi-tenant isolation via userId and composite doc IDs (${userId}_${rawId}).
 */
async function syncCollectionBidirectional<T extends { id?: string | number; numberStr?: string; index?: number; updatedAt?: number }>(
  collectionName: string,
  localItems: T[],
  getId: (item: T) => string,
  userId?: string | null,
  userEmail?: string | null
): Promise<{ mergedItems: T[]; uploadedCount: number; downloadedCount: number; error?: string }> {
  let uploadedCount = 0;
  let downloadedCount = 0;

  try {
    const snap = userId
      ? await getDocs(query(collection(db, collectionName), where('userId', '==', userId)))
      : await getDocs(collection(db, collectionName));

    const remoteMap = new Map<string, any>();
    snap.forEach((d) => {
      // Check for corrupted NaN/undefined/null document in remote Firestore
      if (d.id === 'NaN' || d.id === 'nan' || d.id === 'undefined' || d.id === 'null') {
        // Automatically purge rogue document from Firestore
        deleteDoc(doc(db, collectionName, d.id)).catch(() => {});
        return;
      }
      const data = d.data();
      // If unauthenticated (no userId), NEVER read or overwrite with another user's isolated documents
      if (!userId && (d.id.includes('_') || (data.userId && data.userId !== 'system_default'))) {
        return;
      }
      const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
      remoteMap.set(rawId, { ...data, id: rawId });
    });

    const getDocId = (rawId: string) => (userId ? `${userId}_${rawId}` : rawId);

    // If remote collection is completely empty and local items exist, upload all local items
    if (remoteMap.size === 0 && localItems.length > 0) {
      const batch = writeBatch(db);
      for (const item of localItems) {
        const rawId = getId(item);
        if (!rawId || rawId === 'NaN' || rawId === 'nan' || rawId === 'undefined' || rawId === 'null') continue;
        const docId = getDocId(rawId);
        const docRef = doc(db, collectionName, docId);
        batch.set(
          docRef,
          cleanForFirestore({
            ...item,
            id: docId,
            rawId,
            userId: userId || 'system_default',
            userEmail: userEmail || '',
            isDefault: !userId,
            updatedAt: item.updatedAt || Date.now(),
          }),
          { merge: true }
        );
        uploadedCount++;
      }
      await batch.commit();
      return { mergedItems: localItems, uploadedCount, downloadedCount: 0 };
    }

    const localMap = new Map<string, T>();
    for (const item of localItems) {
      const rawId = getId(item);
      if (!rawId || rawId === 'NaN' || rawId === 'nan' || rawId === 'undefined' || rawId === 'null') continue;
      localMap.set(rawId, item);
    }

    const mergedList: T[] = [];
    const uploadBatch = writeBatch(db);
    let batchHasOperations = false;

    // Check all remote items
    for (const [rawId, remoteItem] of remoteMap.entries()) {
      if (!rawId || rawId === 'NaN' || rawId === 'nan' || rawId === 'undefined' || rawId === 'null') continue;
      const localItem = localMap.get(rawId);

      if (!localItem) {
        // Item exists in remote (e.g. added in Rowy) but not locally: download to local
        mergedList.push(remoteItem as T);
        downloadedCount++;
      } else {
        const remoteTime = Math.max(
          getTimestampMillis(remoteItem.updatedAt),
          getTimestampMillis(remoteItem._updatedAt),
          getTimestampMillis(remoteItem.updated_at),
          getTimestampMillis(remoteItem.lastModified)
        );
        const localTime = getTimestampMillis(localItem.updatedAt);

        // Check for content differences between remote and local
        const different = isItemDifferent(localItem, remoteItem);

        if (remoteTime > localTime || (remoteTime === 0 && different) || (remoteTime === localTime && different)) {
          // Remote is newer or edited in Rowy: take remote, preserving local imageUrl if remote has none
          const localImg = (localItem as any).imageUrl;
          const remoteImg = (remoteItem as any).imageUrl;
          const finalImg = remoteImg !== undefined ? remoteImg : localImg;
          mergedList.push({
            ...localItem,
            ...remoteItem,
            ...(finalImg !== undefined ? { imageUrl: finalImg } : {}),
          });
          downloadedCount++;
        } else if (localTime > remoteTime) {
          // Local is newer (e.g. edited locally in app while offline): upload to remote
          const docId = getDocId(rawId);
          const docRef = doc(db, collectionName, docId);
          uploadBatch.set(
            docRef,
            cleanForFirestore({
              ...localItem,
              id: docId,
              rawId,
              userId: userId || 'system_default',
              userEmail: userEmail || '',
              isDefault: !userId,
              updatedAt: localTime,
            }),
            { merge: true }
          );
          batchHasOperations = true;
          uploadedCount++;
          mergedList.push(localItem);
        } else {
          // In sync: merge fields
          const localImg = (localItem as any).imageUrl;
          const remoteImg = (remoteItem as any).imageUrl;
          const finalImg = remoteImg !== undefined ? remoteImg : localImg;
          mergedList.push({
            ...localItem,
            ...remoteItem,
            ...(finalImg !== undefined ? { imageUrl: finalImg } : {}),
          });
        }
      }
    }

    // Check if any local items were created locally and don't exist remotely
    // CRITICAL: If remoteMap has documents (remoteMap.size > 0), a missing rawId means it was
    // DELETED on the remote (e.g., deleted in Rowy or Firebase Console)!
    // Respect remote deletions: NEVER re-upload items that were deleted remotely!
    for (const [rawId, localItem] of localMap.entries()) {
      if (!rawId || rawId === 'NaN' || rawId === 'nan' || rawId === 'undefined' || rawId === 'null') continue;
      if (!remoteMap.has(rawId)) {
        if (remoteMap.size > 0) {
          // Document was deleted remotely - DO NOT re-upload it back to Firestore!
          continue;
        }
        const docId = getDocId(rawId);
        const docRef = doc(db, collectionName, docId);
        uploadBatch.set(
          docRef,
          cleanForFirestore({
            ...localItem,
            id: docId,
            rawId,
            userId: userId || 'system_default',
            userEmail: userEmail || '',
            isDefault: !userId,
            updatedAt: localItem.updatedAt || Date.now(),
          }),
          { merge: true }
        );
        batchHasOperations = true;
        uploadedCount++;
        mergedList.push(localItem);
      }
    }

    if (batchHasOperations) {
      await uploadBatch.commit();
    }

    return { mergedItems: mergedList, uploadedCount, downloadedCount };
  } catch (err: any) {
    console.error(`Sync failed for collection ${collectionName}:`, err);
    return {
      mergedItems: localItems,
      uploadedCount: 0,
      downloadedCount: 0,
      error: err?.message || String(err),
    };
  }
}

/**
 * Full Bidirectional Two-Way Sync across all memory collections
 * Partitions writes and reads per user when userId is specified.
 */
export async function performFullBidirectionalSync(
  currentData: {
    majorDigits: MajorItem[];
    majorItems: MajorItem[];
    paoItems: PAOItem[];
    shapePegs: PegShapeItem[];
    bodyPegs: BodyPegItem[];
    palaces: MemoryPalace[];
    peopleCards: PersonFaceCard[];
    abstractShapes: AbstractShapeCard[];
    academicPoints: AcademicKeyPoint[];
    personalAssociations: PersonalContactAssociation[];
  },
  userId?: string | null,
  userEmail?: string | null
): Promise<SyncResult> {
  if (!isNetworkOnline()) {
    return {
      success: true,
      message: 'מצב אופליין: כל השינויים נשמרו מקומית במכשיר ויסונכרנו אוטומטית כשתתחבר לרשת.',
      stats: { uploaded: 0, downloaded: 0, collectionsUpdated: [] },
      mergedData: currentData,
    };
  }

  try {
    const stats: SyncStats = {
      uploaded: 0,
      downloaded: 0,
      collectionsUpdated: [],
    };

    // 1. Major Items 00-99
    const validMajor = (currentData.majorItems || []).filter(
      (item) => typeof item?.number === 'number' && !isNaN(item.number) && isFinite(item.number) && item.numberStr !== 'NaN' && item.number >= 0 && item.number <= 99
    );
    const majorRes = await syncCollectionBidirectional(
      'major_items',
      validMajor,
      (item) => {
        const n = typeof item.number === 'number' && !isNaN(item.number) ? item.number : parseInt(item.numberStr, 10);
        if (isNaN(n)) return '';
        return (n < 10 && n >= 0 ? `0${n}` : `${n}`).padStart(2, '0');
      },
      userId,
      userEmail
    );
    stats.uploaded += majorRes.uploadedCount;
    stats.downloaded += majorRes.downloadedCount;
    if (majorRes.uploadedCount > 0 || majorRes.downloadedCount > 0) stats.collectionsUpdated.push('שיטת מז\'ור');

    // 2. PAO Items 00-99
    const validPao = (currentData.paoItems || []).filter(
      (item) => typeof item?.number === 'number' && !isNaN(item.number) && isFinite(item.number) && item.numberStr !== 'NaN' && item.number >= 0 && item.number <= 99
    );
    const paoRes = await syncCollectionBidirectional(
      'pao_items',
      validPao,
      (item) => {
        const n = typeof item.number === 'number' && !isNaN(item.number) ? item.number : parseInt(item.numberStr, 10);
        if (isNaN(n)) return '';
        return (n < 10 && n >= 0 ? `0${n}` : `${n}`).padStart(2, '0');
      },
      userId,
      userEmail
    );
    stats.uploaded += paoRes.uploadedCount;
    stats.downloaded += paoRes.downloadedCount;
    if (paoRes.uploadedCount > 0 || paoRes.downloadedCount > 0) stats.collectionsUpdated.push('PAO');

    // 3. Body Pegs
    const bodyRes = await syncCollectionBidirectional(
      'body_pegs',
      currentData.bodyPegs,
      (item) => String(item.index),
      userId,
      userEmail
    );
    stats.uploaded += bodyRes.uploadedCount;
    stats.downloaded += bodyRes.downloadedCount;
    if (bodyRes.uploadedCount > 0 || bodyRes.downloadedCount > 0) stats.collectionsUpdated.push('מתלי גוף');

    // 4. Shape Pegs
    const shapeRes = await syncCollectionBidirectional(
      'shape_pegs',
      currentData.shapePegs,
      (item) => String(item.number),
      userId,
      userEmail
    );
    stats.uploaded += shapeRes.uploadedCount;
    stats.downloaded += shapeRes.downloadedCount;
    if (shapeRes.uploadedCount > 0 || shapeRes.downloadedCount > 0) stats.collectionsUpdated.push('צורות מספרים');

    // 5. Palaces
    const palacesRes = await syncCollectionBidirectional(
      'palaces',
      currentData.palaces,
      (item) => item.id,
      userId,
      userEmail
    );
    stats.uploaded += palacesRes.uploadedCount;
    stats.downloaded += palacesRes.downloadedCount;
    if (palacesRes.uploadedCount > 0 || palacesRes.downloadedCount > 0) stats.collectionsUpdated.push('ארמונות זיכרון');

    // 6. Personal Associations
    const personalRes = await syncCollectionBidirectional(
      'personal_associations',
      currentData.personalAssociations,
      (item) => item.id,
      userId,
      userEmail
    );
    stats.uploaded += personalRes.uploadedCount;
    stats.downloaded += personalRes.downloadedCount;
    if (personalRes.uploadedCount > 0 || personalRes.downloadedCount > 0) stats.collectionsUpdated.push('אסוציאציות אישיות');

    // 7. People Cards
    const peopleRes = await syncCollectionBidirectional(
      'people_cards',
      currentData.peopleCards,
      (item) => item.id,
      userId,
      userEmail
    );
    stats.uploaded += peopleRes.uploadedCount;
    stats.downloaded += peopleRes.downloadedCount;

    // 8. Abstract Shapes
    const abstractRes = await syncCollectionBidirectional(
      'abstract_shapes',
      currentData.abstractShapes,
      (item) => item.id,
      userId,
      userEmail
    );
    stats.uploaded += abstractRes.uploadedCount;
    stats.downloaded += abstractRes.downloadedCount;

    // 9. Academic Points
    const academicRes = await syncCollectionBidirectional(
      'academic_points',
      currentData.academicPoints,
      (item) => item.id,
      userId,
      userEmail
    );
    stats.uploaded += academicRes.uploadedCount;
    stats.downloaded += academicRes.downloadedCount;

    // Sort major items by number
    const sortedMajor = [...majorRes.mergedItems].sort((a, b) => a.number - b.number);
    const sortedPao = [...paoRes.mergedItems].sort((a, b) => a.number - b.number);
    const sortedBody = [...bodyRes.mergedItems].sort((a, b) => a.index - b.index);
    const sortedShapes = [...shapeRes.mergedItems].sort((a, b) => a.number - b.number);
    const sortedDigits = currentData.majorDigits || [];

    // Check if any errors occurred
    const collectionErrors = [
      majorRes.error,
      paoRes.error,
      bodyRes.error,
      shapeRes.error,
      palacesRes.error,
      personalRes.error,
      peopleRes.error,
      abstractRes.error,
      academicRes.error,
    ].filter(Boolean);

    if (collectionErrors.length > 0 && stats.uploaded === 0 && stats.downloaded === 0) {
      return {
        success: false,
        message: `שגיאה בסנכרון לענן: ${collectionErrors[0]}`,
        stats,
        mergedData: currentData,
      };
    }

    const message =
      stats.uploaded === 0 && stats.downloaded === 0
        ? 'כל הנתונים במכשיר ובענן מסונכרנים ומעודכנים לחלוטין!'
        : `סנכרון דו-כיווני הצליח: ${stats.uploaded} שינויים הועלו לענן, ${stats.downloaded} עודכנו מהענן.`;

    return {
      success: true,
      message,
      stats,
      mergedData: {
        majorDigits: sortedDigits,
        majorItems: sortedMajor,
        paoItems: sortedPao,
        shapePegs: sortedShapes,
        bodyPegs: sortedBody,
        palaces: palacesRes.mergedItems,
        peopleCards: peopleRes.mergedItems,
        abstractShapes: abstractRes.mergedItems,
        academicPoints: academicRes.mergedItems,
        personalAssociations: personalRes.mergedItems,
      },
    };
  } catch (err: any) {
    console.error('Bidirectional sync error:', err);
    return {
      success: false,
      message: `שגיאה בסנכרון לענן: ${err?.message || err}`,
      mergedData: currentData,
    };
  }
}

export interface RealtimeSyncCallbacks {
  onMajorItems?: (items: MajorItem[], hasPendingWrites: boolean) => void;
  onPaoItems?: (items: PAOItem[], hasPendingWrites: boolean) => void;
  onBodyPegs?: (items: BodyPegItem[], hasPendingWrites: boolean) => void;
  onShapePegs?: (items: PegShapeItem[], hasPendingWrites: boolean) => void;
  onPalaces?: (items: MemoryPalace[], hasPendingWrites: boolean) => void;
  onPersonalAssociations?: (items: PersonalContactAssociation[], hasPendingWrites: boolean) => void;
  onPeopleCards?: (items: PersonFaceCard[], hasPendingWrites: boolean) => void;
  onAbstractShapes?: (items: AbstractShapeCard[], hasPendingWrites: boolean) => void;
  onAcademicPoints?: (items: AcademicKeyPoint[], hasPendingWrites: boolean) => void;
  onMajorDigits?: (items: MajorItem[], hasPendingWrites: boolean) => void;
  onError?: (collectionName: string, error: any) => void;
}

/**
 * Starts real-time onSnapshot listeners for Firestore collections.
 * When userId is provided, queries only documents belonging to that user's isolated branch (where('userId', '==', userId)),
 * preventing cross-user pollution while keeping Rowy tables fully synchronized.
 */
export function startRealtimeCloudSync(callbacks: RealtimeSyncCallbacks, userId?: string | null): () => void {
  const unsubs: (() => void)[] = [];

  try {
    // 1. major_items (00-99)
    const majorTarget = userId
      ? query(collection(db, 'major_items'), where('userId', '==', userId))
      : collection(db, 'major_items');

    const unsubMajor = onSnapshot(
      majorTarget,
      (snap) => {
        if (snap.empty) return;
        const items: MajorItem[] = [];
        snap.forEach((d) => {
          if (d.id === 'NaN' || d.id === 'nan' || d.id === 'undefined' || d.id === 'null') {
            deleteDoc(doc(db, 'major_items', d.id)).catch(() => {});
            return;
          }
          const data = d.data();
          if (!userId && (d.id.includes('_') || (data.userId && data.userId !== 'system_default'))) {
            return;
          }
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          const parsedNum = typeof data.number === 'number' ? data.number : parseInt(String(data.numberStr || rawId), 10);
          if (isNaN(parsedNum) || parsedNum < 0 || parsedNum > 99) {
            return;
          }
          const num = parsedNum;
          const numStr = (num < 10 ? `0${num}` : String(num)).padStart(2, '0');

          let word = (data.defaultWord && data.defaultWord !== 'null') ? data.defaultWord : '';
          let hint = (data.imageHint && data.imageHint !== 'null') ? data.imageHint : '';
          let cons = (data.consonants && data.consonants !== 'null') ? data.consonants : '';

          items.push({
            id: numStr,
            number: num,
            numberStr: numStr,
            consonants: cons,
            defaultWord: word,
            imageHint: hint,
            customNotes: data.customNotes && data.customNotes !== 'null' ? data.customNotes : undefined,
            is_ready_for_practice: Boolean(data.is_ready_for_practice),
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at),
              getTimestampMillis(data.lastModified),
              Date.now()
            ),
          });
        });
        items.sort((a, b) => a.number - b.number);
        callbacks.onMajorItems?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('major_items', err)
    );
    unsubs.push(unsubMajor);

    // 2. pao_items (00-99)
    const paoTarget = userId
      ? query(collection(db, 'pao_items'), where('userId', '==', userId))
      : collection(db, 'pao_items');

    const unsubPao = onSnapshot(
      paoTarget,
      (snap) => {
        if (snap.empty) return;
        const items: PAOItem[] = [];
        snap.forEach((d) => {
          if (d.id === 'NaN' || d.id === 'nan' || d.id === 'undefined' || d.id === 'null') {
            deleteDoc(doc(db, 'pao_items', d.id)).catch(() => {});
            return;
          }
          const data = d.data();
          if (!userId && (d.id.includes('_') || (data.userId && data.userId !== 'system_default'))) {
            return;
          }
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          const parsedNum = typeof data.number === 'number' ? data.number : parseInt(String(data.numberStr || rawId), 10);
          if (isNaN(parsedNum) || parsedNum < 0 || parsedNum > 99) {
            return;
          }
          const num = parsedNum;
          const numStr = (num < 10 ? `0${num}` : String(num)).padStart(2, '0');

          let person = (data.person && data.person !== 'null') ? data.person : '';
          let action = (data.action && data.action !== 'null') ? data.action : '';
          let object = (data.object && data.object !== 'null') ? data.object : '';
          let scene = (data.scene && data.scene !== 'null') ? data.scene : '';
          let imageUrl = (data.imageUrl && data.imageUrl !== 'null') ? data.imageUrl : (data.imageUrl === '' ? '' : undefined);

          items.push({
            id: numStr,
            number: num,
            numberStr: numStr,
            person,
            action,
            object,
            scene,
            imageUrl: imageUrl || (data.imageUrl === '' ? '' : undefined),
            is_ready_for_practice: Boolean(data.is_ready_for_practice),
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at),
              getTimestampMillis(data.lastModified),
              Date.now()
            ),
          });
        });
        items.sort((a, b) => a.number - b.number);
        callbacks.onPaoItems?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('pao_items', err)
    );
    unsubs.push(unsubPao);

    // 3. body_pegs
    const bodyTarget = userId
      ? query(collection(db, 'body_pegs'), where('userId', '==', userId))
      : collection(db, 'body_pegs');

    const unsubBody = onSnapshot(
      bodyTarget,
      (snap) => {
        if (snap.empty) return;
        const items: BodyPegItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          const idx = typeof data.index === 'number' ? data.index : parseInt(rawId, 10);
          const bodyPart = (data.bodyPartHebrew && data.bodyPartHebrew !== 'null') ? data.bodyPartHebrew : '';
          const defaultObj = (data.defaultObject && data.defaultObject !== 'null') ? data.defaultObject : '';
          const tip = (data.kineticTip && data.kineticTip !== 'null') ? data.kineticTip : '';

          items.push({
            id: rawId,
            index: isNaN(idx) ? 1 : idx,
            bodyPartHebrew: bodyPart,
            defaultObject: defaultObj,
            kineticTip: tip,
            is_ready_for_practice: Boolean(data.is_ready_for_practice),
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at),
              Date.now()
            ),
          });
        });
        items.sort((a, b) => a.index - b.index);
        callbacks.onBodyPegs?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('body_pegs', err)
    );
    unsubs.push(unsubBody);

    // 4. shape_pegs
    const shapeTarget = userId
      ? query(collection(db, 'shape_pegs'), where('userId', '==', userId))
      : collection(db, 'shape_pegs');

    const unsubShape = onSnapshot(
      shapeTarget,
      (snap) => {
        if (snap.empty) return;
        const items: PegShapeItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          const num = typeof data.number === 'number' ? data.number : parseInt(rawId, 10);
          const shapeName = (data.shapeName && data.shapeName !== 'null') ? data.shapeName : '';
          const defaultObj = (data.defaultObject && data.defaultObject !== 'null') ? data.defaultObject : '';
          const tip = (data.kineticTip && data.kineticTip !== 'null') ? data.kineticTip : '';

          items.push({
            id: rawId,
            number: isNaN(num) ? 0 : num,
            shapeName,
            visualMetaphor: data.visualMetaphor || '',
            defaultObject: defaultObj,
            kineticTip: tip,
            is_ready_for_practice: Boolean(data.is_ready_for_practice),
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at),
              Date.now()
            ),
          });
        });
        items.sort((a, b) => a.number - b.number);
        callbacks.onShapePegs?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('shape_pegs', err)
    );
    unsubs.push(unsubShape);

    // 5. palaces
    const palacesTarget = userId
      ? query(collection(db, 'palaces'), where('userId', '==', userId))
      : collection(db, 'palaces');

    const unsubPalaces = onSnapshot(
      palacesTarget,
      (snap) => {
        if (snap.empty) return;
        const items: MemoryPalace[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          items.push({
            id: rawId,
            name: data.name || 'ארמון',
            description: data.description || '',
            icon: data.icon || 'Building',
            category: data.category || 'home',
            isPermanent: data.isPermanent ?? true,
            loci: Array.isArray(data.loci) ? data.loci : [],
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at)
            ),
          });
        });
        callbacks.onPalaces?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('palaces', err)
    );
    unsubs.push(unsubPalaces);

    // 6. personal_associations
    const personalTarget = userId
      ? query(collection(db, 'personal_associations'), where('userId', '==', userId))
      : collection(db, 'personal_associations');

    const unsubPersonal = onSnapshot(
      personalTarget,
      (snap) => {
        if (snap.empty) return;
        const items: PersonalContactAssociation[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          items.push({
            id: rawId,
            targetSubject: data.targetSubject || '',
            storedNumberOrFact: data.storedNumberOrFact || '',
            encodedMnemonic: data.encodedMnemonic || '',
            methodUsed: data.methodUsed || 'major',
            createdAt: getTimestampMillis(data.createdAt),
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at)
            ),
            is_ready_for_practice: data.is_ready_for_practice ?? false,
            successCount: data.successCount || 0,
            failCount: data.failCount || 0,
          });
        });
        callbacks.onPersonalAssociations?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('personal_associations', err)
    );
    unsubs.push(unsubPersonal);

    // 7. people_cards
    const peopleTarget = userId
      ? query(collection(db, 'people_cards'), where('userId', '==', userId))
      : collection(db, 'people_cards');

    const unsubPeople = onSnapshot(
      peopleTarget,
      (snap) => {
        if (snap.empty) return;
        const items: PersonFaceCard[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          items.push({
            id: rawId,
            name: data.name || '',
            roleOrJob: data.roleOrJob || '',
            avatarUrl: data.avatarUrl || '',
            avatarSeed: data.avatarSeed || '',
            morphologicalAnchor: data.morphologicalAnchor || '',
            substituteWord: data.substituteWord || '',
            mnemonicScene: data.mnemonicScene || '',
            is_ready_for_practice: data.is_ready_for_practice ?? false,
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at)
            ),
          });
        });
        callbacks.onPeopleCards?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('people_cards', err)
    );
    unsubs.push(unsubPeople);

    // 8. abstract_shapes
    const abstractTarget = userId
      ? query(collection(db, 'abstract_shapes'), where('userId', '==', userId))
      : collection(db, 'abstract_shapes');

    const unsubAbstract = onSnapshot(
      abstractTarget,
      (snap) => {
        if (snap.empty) return;
        const items: AbstractShapeCard[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          items.push({
            id: rawId,
            title: data.title || '',
            svgShapeType: data.svgShapeType || 'spiral',
            textureType: data.textureType || 'smooth',
            textureDigit: typeof data.textureDigit === 'number' ? data.textureDigit : 1,
            pareidoliaHint: data.pareidoliaHint || '',
            mnemonicCode: data.mnemonicCode || '',
            is_ready_for_practice: data.is_ready_for_practice ?? false,
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at)
            ),
          });
        });
        callbacks.onAbstractShapes?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('abstract_shapes', err)
    );
    unsubs.push(unsubAbstract);

    // 9. academic_points
    const academicTarget = userId
      ? query(collection(db, 'academic_points'), where('userId', '==', userId))
      : collection(db, 'academic_points');

    const unsubAcademic = onSnapshot(
      academicTarget,
      (snap) => {
        if (snap.empty) return;
        const items: AcademicKeyPoint[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const rawId = data.rawId || (userId && d.id.startsWith(`${userId}_`) ? d.id.slice(userId.length + 1) : d.id);
          items.push({
            id: rawId,
            conceptTitle: data.conceptTitle || '',
            discipline: data.discipline || '',
            sourceSummary: data.sourceSummary || '',
            keyWord: data.keyWord || '',
            visualAnchor: data.visualAnchor || '',
            palaceLocusInfo: data.palaceLocusInfo || '',
            mnemonicScene: data.mnemonicScene || '',
            is_ready_for_practice: data.is_ready_for_practice ?? false,
            updatedAt: Math.max(
              getTimestampMillis(data.updatedAt),
              getTimestampMillis(data._updatedAt),
              getTimestampMillis(data.updated_at)
            ),
          });
        });
        callbacks.onAcademicPoints?.(items, snap.metadata.hasPendingWrites);
      },
      (err) => callbacks.onError?.('academic_points', err)
    );
    unsubs.push(unsubAcademic);

  } catch (err) {
    console.warn('Error starting realtime cloud listeners:', err);
  }

  return () => {
    unsubs.forEach((unsub) => {
      try { unsub(); } catch {}
    });
  };
}

/**
 * Restores original PAO custom items (without initials like ס.ס.) from the original user branch
 * (ZzIhtNprc8VPUDSWQ0D42BLSijZ1_*) or default documents, and cleans up the duplicate items
 * (wuGN7btEqMgRhVDhdUkj4k5BxhJ2_*) from Firestore.
 */
export async function restoreOriginalPAOAndCleanDuplicates(
  currentUserId?: string | null
): Promise<{
  success: boolean;
  message: string;
  restoredCount: number;
  deletedCount: number;
  restoredItems?: PAOItem[];
}> {
  try {
    let restoredCount = 0;
    let deletedCount = 0;

    // 1. Fetch all docs from pao_items
    const snap = await getDocs(collection(db, 'pao_items'));
    const cleanItems: PAOItem[] = [];
    const docsToDelete: string[] = [];

    snap.forEach((d) => {
      const id = d.id;
      const data = d.data();
      // Find unwanted duplicate branch or NaN docs
      if (
        id.startsWith('wuGN7btEqMgRhVDhdUkj4k5BxhJ2_') ||
        id === 'NaN' ||
        id.includes('NaN') ||
        data.id === 'NaN' ||
        isNaN(data.number)
      ) {
        docsToDelete.push(id);
        return;
      }

      // Collect best original data: prefer ZzIhtNprc8VPUDSWQ0D42BLSijZ1_* or root 00..99
      if (
        id.startsWith('ZzIhtNprc8VPUDSWQ0D42BLSiJz1_') ||
        id.startsWith('ZzIhtNprc8VPUDSWQ0D42BLSijZ1_') ||
        (!id.includes('_') && id.length <= 3)
      ) {
        const num = typeof data.number === 'number' ? data.number : parseInt(data.numberStr || id, 10);
        if (!isNaN(num) && num >= 0 && num <= 99) {
          const numStr = (num < 10 ? `0${num}` : `${num}`).padStart(2, '0');
          cleanItems.push({
            id: numStr,
            number: num,
            numberStr: numStr,
            person: (data.person || '').replace(/\s*\([^\)]*\)\s*$/, '').trim(),
            action: (data.action || '').trim(),
            object: (data.object || '').trim(),
            scene: (data.scene || '').trim(),
            imageUrl: data.imageUrl || undefined,
            is_ready_for_practice: Boolean(data.is_ready_for_practice ?? true),
            updatedAt: Date.now(),
          });
        }
      }
    });

    // Start with the authoritative DEFAULT_PAO_ITEMS (exact 100 items from user CSV)
    const uniqueCleanMap = new Map<number, PAOItem>();
    for (const def of DEFAULT_PAO_ITEMS) {
      uniqueCleanMap.set(def.number, {
        id: def.numberStr,
        number: def.number,
        numberStr: def.numberStr,
        person: def.person,
        action: def.action,
        object: def.object,
        scene: def.scene || '',
        imageUrl: def.imageUrl,
        is_ready_for_practice: def.is_ready_for_practice ?? true,
        updatedAt: Date.now(),
      });
    }

    // Preserve any existing generated imageUrl from Firestore documents
    for (const it of cleanItems) {
      if (it.imageUrl && uniqueCleanMap.has(it.number)) {
        const cur = uniqueCleanMap.get(it.number)!;
        uniqueCleanMap.set(it.number, { ...cur, imageUrl: it.imageUrl });
      }
    }

    const finalCleanList = Array.from(uniqueCleanMap.values()).sort((a, b) => a.number - b.number);
    restoredCount = finalCleanList.length;

    // 2. Delete unwanted duplicate and NaN documents from Firestore
    for (const docId of docsToDelete) {
      try {
        await deleteDoc(doc(db, 'pao_items', docId));
        deletedCount++;
      } catch (e) {
        console.warn('Failed to delete duplicate doc:', docId, e);
      }
    }

    // 3. Update root default documents 00..99 with clean data (Rowy shows these!)
    const rootBatch = writeBatch(db);
    for (const it of finalCleanList) {
      rootBatch.set(
        doc(db, 'pao_items', it.numberStr),
        cleanForFirestore({
          id: it.numberStr,
          rawId: it.numberStr,
          number: it.number,
          numberStr: it.numberStr,
          person: it.person,
          action: it.action,
          object: it.object,
          scene: it.scene || null,
          imageUrl: it.imageUrl || null,
          is_ready_for_practice: Boolean(it.is_ready_for_practice),
          userId: 'system_default',
          isDefault: true,
          updatedAt: Date.now(),
        }),
        { merge: true }
      );
    }
    await rootBatch.commit();

    // 4. If currentUserId is logged in, also update their branch
    if (currentUserId && finalCleanList.length > 0) {
      const userBatch = writeBatch(db);
      for (const it of finalCleanList) {
        const docId = `${currentUserId}_${it.numberStr}`;
        userBatch.set(
          doc(db, 'pao_items', docId),
          cleanForFirestore({
            ...it,
            id: docId,
            rawId: it.numberStr,
            userId: currentUserId,
            isDefault: false,
            updatedAt: Date.now(),
          }),
          { merge: true }
        );
      }
      await userBatch.commit();
    }

    return {
      success: true,
      message: `שוחזרו בהצלחה ${restoredCount} שלשות PAO מקוריות, ונמחקו ${deletedCount} רשומות כפולות מ-Firestore!`,
      restoredCount,
      deletedCount,
      restoredItems: finalCleanList,
    };
  } catch (err: any) {
    console.error('Error restoring PAO items:', err);
    return {
      success: false,
      message: `שגיאה בשחזור: ${err?.message || err}`,
      restoredCount: 0,
      deletedCount: 0,
    };
  }
}
