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
        number: item.number,
        numberStr: item.numberStr,
        consonants: item.consonants,
        defaultWord: item.defaultWord,
        userWord: item.userWord || null,
        imageHint: item.imageHint,
        userImageHint: item.userImageHint || null,
        customNotes: item.customNotes || null,
        is_ready_for_practice: item.is_ready_for_practice ?? false,
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
        number: item.number,
        numberStr: item.numberStr,
        person: item.person,
        action: item.action,
        object: item.object,
        userPerson: item.userPerson || null,
        userAction: item.userAction || null,
        userObject: item.userObject || null,
        is_ready_for_practice: item.is_ready_for_practice ?? false,
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
        index: b.index,
        bodyPartHebrew: b.bodyPartHebrew,
        userBodyPart: b.userBodyPart || null,
        defaultObject: b.defaultObject,
        userObject: b.userObject || null,
        kineticTip: b.kineticTip,
        userKineticTip: b.userKineticTip || null,
        is_ready_for_practice: b.is_ready_for_practice ?? false,
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
        number: s.number,
        shapeName: s.shapeName,
        userShapeName: s.userShapeName || null,
        visualMetaphor: s.visualMetaphor,
        defaultObject: s.defaultObject,
        userObject: s.userObject || null,
        kineticTip: s.kineticTip,
        userKineticTip: s.userKineticTip || null,
        is_ready_for_practice: s.is_ready_for_practice ?? false,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Palaces
    for (const p of DEFAULT_PALACES) {
      const docRef = doc(db, 'palaces', p.id);
      itemsBatch.set(docRef, {
        ...p,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // People Cards
    for (const c of DEFAULT_PEOPLE_CARDS) {
      const docRef = doc(db, 'people_cards', c.id);
      itemsBatch.set(docRef, {
        ...c,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Abstract Shapes
    for (const a of DEFAULT_ABSTRACT_SHAPES) {
      const docRef = doc(db, 'abstract_shapes', a.id);
      itemsBatch.set(docRef, {
        ...a,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Academic Points
    for (const ap of DEFAULT_ACADEMIC_POINTS) {
      const docRef = doc(db, 'academic_points', ap.id);
      itemsBatch.set(docRef, {
        ...ap,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

    // Personal Associations
    for (const pa of DEFAULT_PERSONAL_ASSOCIATIONS) {
      const docRef = doc(db, 'personal_associations', pa.id);
      itemsBatch.set(docRef, {
        ...pa,
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
    remoteMap.set(getId(item), item);
  }

  let hasAnyChanges = false;
  const merged: T[] = [];
  const processedIds = new Set<string>();

  for (const prevItem of prev) {
    const id = getId(prevItem);
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
        merged.push({
          ...prevItem,
          ...remoteItem,
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
 */
async function syncCollectionBidirectional<T extends { id?: string | number; numberStr?: string; index?: number; updatedAt?: number }>(
  collectionName: string,
  localItems: T[],
  getId: (item: T) => string
): Promise<{ mergedItems: T[]; uploadedCount: number; downloadedCount: number; error?: string }> {
  let uploadedCount = 0;
  let downloadedCount = 0;

  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);

    const remoteMap = new Map<string, any>();
    snap.forEach((d) => {
      remoteMap.set(d.id, { ...d.data(), id: d.id });
    });

    // If remote collection is completely empty and local items exist, upload all local items
    if (remoteMap.size === 0 && localItems.length > 0) {
      const batch = writeBatch(db);
      for (const item of localItems) {
        const id = getId(item);
        const docRef = doc(db, collectionName, id);
        batch.set(docRef, cleanForFirestore({ ...item, id, updatedAt: item.updatedAt || Date.now() }), { merge: true });
        uploadedCount++;
      }
      await batch.commit();
      return { mergedItems: localItems, uploadedCount, downloadedCount: 0 };
    }

    const localMap = new Map<string, T>();
    for (const item of localItems) {
      localMap.set(getId(item), item);
    }

    const mergedList: T[] = [];
    const uploadBatch = writeBatch(db);
    let batchHasOperations = false;

    // Check all remote items
    for (const [id, remoteItem] of remoteMap.entries()) {
      const localItem = localMap.get(id);

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

        // Check for content differences between remote (e.g. edited in Rowy) and local
        const remoteUserWord = remoteItem.userWord !== undefined ? remoteItem.userWord : null;
        const localUserWord = (localItem as any).userWord !== undefined ? (localItem as any).userWord : null;
        const remoteDefaultWord = remoteItem.defaultWord !== undefined ? remoteItem.defaultWord : null;
        const localDefaultWord = (localItem as any).defaultWord !== undefined ? (localItem as any).defaultWord : null;
        const contentChangedInRowy = remoteUserWord !== localUserWord || remoteDefaultWord !== localDefaultWord;

        if (remoteTime > localTime || (remoteTime === 0 && contentChangedInRowy) || (remoteTime === localTime && contentChangedInRowy)) {
          // Remote is newer or edited in Rowy: take remote
          mergedList.push({ ...localItem, ...remoteItem });
          downloadedCount++;
        } else if (localTime > remoteTime) {
          // Local is newer (e.g. edited locally in app while offline): upload to remote
          const docRef = doc(db, collectionName, id);
          uploadBatch.set(docRef, cleanForFirestore({ ...localItem, id, updatedAt: localTime }), { merge: true });
          batchHasOperations = true;
          uploadedCount++;
          mergedList.push(localItem);
        } else {
          // In sync: merge fields
          mergedList.push({ ...localItem, ...remoteItem });
        }
      }
    }

    // Check if any local items were created locally and don't exist remotely
    for (const [id, localItem] of localMap.entries()) {
      if (!remoteMap.has(id)) {
        const docRef = doc(db, collectionName, id);
        uploadBatch.set(docRef, cleanForFirestore({ ...localItem, id, updatedAt: localItem.updatedAt || Date.now() }), { merge: true });
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
 */
export async function performFullBidirectionalSync(currentData: {
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
}): Promise<SyncResult> {
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
    const majorRes = await syncCollectionBidirectional(
      'major_items',
      currentData.majorItems,
      (item) => item.numberStr.padStart(2, '0')
    );
    stats.uploaded += majorRes.uploadedCount;
    stats.downloaded += majorRes.downloadedCount;
    if (majorRes.uploadedCount > 0 || majorRes.downloadedCount > 0) stats.collectionsUpdated.push('שיטת מז\'ור');

    // 2. PAO Items 00-99
    const paoRes = await syncCollectionBidirectional(
      'pao_items',
      currentData.paoItems,
      (item) => item.numberStr.padStart(2, '0')
    );
    stats.uploaded += paoRes.uploadedCount;
    stats.downloaded += paoRes.downloadedCount;
    if (paoRes.uploadedCount > 0 || paoRes.downloadedCount > 0) stats.collectionsUpdated.push('PAO');

    // 3. Body Pegs
    const bodyRes = await syncCollectionBidirectional(
      'body_pegs',
      currentData.bodyPegs,
      (item) => String(item.index)
    );
    stats.uploaded += bodyRes.uploadedCount;
    stats.downloaded += bodyRes.downloadedCount;
    if (bodyRes.uploadedCount > 0 || bodyRes.downloadedCount > 0) stats.collectionsUpdated.push('מתלי גוף');

    // 4. Shape Pegs
    const shapeRes = await syncCollectionBidirectional(
      'shape_pegs',
      currentData.shapePegs,
      (item) => String(item.number)
    );
    stats.uploaded += shapeRes.uploadedCount;
    stats.downloaded += shapeRes.downloadedCount;
    if (shapeRes.uploadedCount > 0 || shapeRes.downloadedCount > 0) stats.collectionsUpdated.push('צורות מספרים');

    // 5. Palaces
    const palacesRes = await syncCollectionBidirectional(
      'palaces',
      currentData.palaces,
      (item) => item.id
    );
    stats.uploaded += palacesRes.uploadedCount;
    stats.downloaded += palacesRes.downloadedCount;
    if (palacesRes.uploadedCount > 0 || palacesRes.downloadedCount > 0) stats.collectionsUpdated.push('ארמונות זיכרון');

    // 6. Personal Associations
    const personalRes = await syncCollectionBidirectional(
      'personal_associations',
      currentData.personalAssociations,
      (item) => item.id
    );
    stats.uploaded += personalRes.uploadedCount;
    stats.downloaded += personalRes.downloadedCount;
    if (personalRes.uploadedCount > 0 || personalRes.downloadedCount > 0) stats.collectionsUpdated.push('אסוציאציות אישיות');

    // 7. People Cards
    const peopleRes = await syncCollectionBidirectional(
      'people_cards',
      currentData.peopleCards,
      (item) => item.id
    );
    stats.uploaded += peopleRes.uploadedCount;
    stats.downloaded += peopleRes.downloadedCount;

    // 8. Abstract Shapes
    const abstractRes = await syncCollectionBidirectional(
      'abstract_shapes',
      currentData.abstractShapes,
      (item) => item.id
    );
    stats.uploaded += abstractRes.uploadedCount;
    stats.downloaded += abstractRes.downloadedCount;

    // 9. Academic Points
    const academicRes = await syncCollectionBidirectional(
      'academic_points',
      currentData.academicPoints,
      (item) => item.id
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
 * Starts real-time onSnapshot listeners for all Firestore collections.
 * Automatically synchronizes changes made in Rowy or other browser sessions directly to the local UI in real time.
 */
export function startRealtimeCloudSync(callbacks: RealtimeSyncCallbacks): () => void {
  const unsubs: (() => void)[] = [];

  try {
    // 1. major_items (00-99)
    const unsubMajor = onSnapshot(
      collection(db, 'major_items'),
      (snap) => {
        if (snap.empty) return;
        const items: MajorItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const num = typeof data.number === 'number' ? data.number : parseInt(String(data.numberStr || d.id), 10);
          const numStr = String(data.numberStr ?? (num < 10 ? `0${num}` : String(num))).padStart(2, '0');

          // Harmonize word between Rowy columns (defaultWord & userWord)
          let word = '';
          if (data.defaultWord && data.defaultWord !== 'null') word = data.defaultWord;
          if (data.userWord && data.userWord !== 'null' && data.userWord !== data.defaultWord) {
            word = data.userWord;
          }
          if (!word) word = (data.defaultWord !== 'null' ? data.defaultWord : '') || (data.userWord !== 'null' ? data.userWord : '') || '';

          // Harmonize hint
          let hint = '';
          if (data.imageHint && data.imageHint !== 'null') hint = data.imageHint;
          if (data.userImageHint && data.userImageHint !== 'null' && data.userImageHint !== data.imageHint) {
            hint = data.userImageHint;
          }
          if (!hint) hint = (data.imageHint !== 'null' ? data.imageHint : '') || (data.userImageHint !== 'null' ? data.userImageHint : '') || '';

          // Harmonize consonants
          let cons = '';
          if (data.consonants && data.consonants !== 'null') cons = data.consonants;
          if (data.userConsonants && data.userConsonants !== 'null' && data.userConsonants !== data.consonants) {
            cons = data.userConsonants;
          }
          if (!cons) cons = (data.consonants !== 'null' ? data.consonants : '') || (data.userConsonants !== 'null' ? data.userConsonants : '') || '';

          items.push({
            id: d.id,
            number: isNaN(num) ? 0 : num,
            numberStr: numStr,
            consonants: cons,
            userConsonants: cons,
            defaultWord: word,
            userWord: word,
            imageHint: hint,
            userImageHint: hint,
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
    const unsubPao = onSnapshot(
      collection(db, 'pao_items'),
      (snap) => {
        if (snap.empty) return;
        const items: PAOItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const num = typeof data.number === 'number' ? data.number : parseInt(String(data.numberStr || d.id), 10);
          const numStr = String(data.numberStr ?? (num < 10 ? `0${num}` : String(num))).padStart(2, '0');

          let person = (data.person !== 'null' ? data.person : '') || (data.userPerson !== 'null' ? data.userPerson : '') || '';
          if (data.userPerson && data.userPerson !== 'null' && data.userPerson !== data.person) {
            person = data.userPerson;
          }

          let action = (data.action !== 'null' ? data.action : '') || (data.userAction !== 'null' ? data.userAction : '') || '';
          if (data.userAction && data.userAction !== 'null' && data.userAction !== data.action) {
            action = data.userAction;
          }

          let object = (data.object !== 'null' ? data.object : '') || (data.userObject !== 'null' ? data.userObject : '') || '';
          if (data.userObject && data.userObject !== 'null' && data.userObject !== data.object) {
            object = data.userObject;
          }

          items.push({
            id: d.id,
            number: isNaN(num) ? 0 : num,
            numberStr: numStr,
            person,
            action,
            object,
            userPerson: person,
            userAction: action,
            userObject: object,
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
    const unsubBody = onSnapshot(
      collection(db, 'body_pegs'),
      (snap) => {
        if (snap.empty) return;
        const items: BodyPegItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const idx = typeof data.index === 'number' ? data.index : parseInt(d.id, 10);
          const bodyPart = (data.bodyPartHebrew !== 'null' ? data.bodyPartHebrew : '') || (data.userBodyPart !== 'null' ? data.userBodyPart : '') || '';
          const defaultObj = (data.defaultObject !== 'null' ? data.defaultObject : '') || (data.userObject !== 'null' ? data.userObject : '') || '';
          const tip = (data.kineticTip !== 'null' ? data.kineticTip : '') || (data.userKineticTip !== 'null' ? data.userKineticTip : '') || '';

          items.push({
            id: d.id,
            index: isNaN(idx) ? 1 : idx,
            bodyPartHebrew: bodyPart,
            userBodyPart: bodyPart,
            defaultObject: defaultObj,
            userObject: defaultObj,
            kineticTip: tip,
            userKineticTip: tip,
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
    const unsubShape = onSnapshot(
      collection(db, 'shape_pegs'),
      (snap) => {
        if (snap.empty) return;
        const items: PegShapeItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const num = typeof data.number === 'number' ? data.number : parseInt(d.id, 10);
          const shapeName = (data.shapeName !== 'null' ? data.shapeName : '') || (data.userShapeName !== 'null' ? data.userShapeName : '') || '';
          const defaultObj = (data.defaultObject !== 'null' ? data.defaultObject : '') || (data.userObject !== 'null' ? data.userObject : '') || '';
          const tip = (data.kineticTip !== 'null' ? data.kineticTip : '') || (data.userKineticTip !== 'null' ? data.userKineticTip : '') || '';

          items.push({
            id: d.id,
            number: isNaN(num) ? 0 : num,
            shapeName,
            userShapeName: shapeName,
            visualMetaphor: data.visualMetaphor || '',
            defaultObject: defaultObj,
            userObject: defaultObj,
            kineticTip: tip,
            userKineticTip: tip,
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
    const unsubPalaces = onSnapshot(
      collection(db, 'palaces'),
      (snap) => {
        if (snap.empty) return;
        const items: MemoryPalace[] = [];
        snap.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
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
    const unsubPersonal = onSnapshot(
      collection(db, 'personal_associations'),
      (snap) => {
        if (snap.empty) return;
        const items: PersonalContactAssociation[] = [];
        snap.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
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
    const unsubPeople = onSnapshot(
      collection(db, 'people_cards'),
      (snap) => {
        if (snap.empty) return;
        const items: PersonFaceCard[] = [];
        snap.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            name: data.name || '',
            roleOrJob: data.roleOrJob || '',
            avatarUrl: data.avatarUrl || '',
            avatarSeed: data.avatarSeed || '',
            morphologicalAnchor: data.morphologicalAnchor || '',
            substituteWord: data.substituteWord || '',
            mnemonicScene: data.mnemonicScene || '',
            userCustomScene: data.userCustomScene || undefined,
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
    const unsubAbstract = onSnapshot(
      collection(db, 'abstract_shapes'),
      (snap) => {
        if (snap.empty) return;
        const items: AbstractShapeCard[] = [];
        snap.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
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
    const unsubAcademic = onSnapshot(
      collection(db, 'academic_points'),
      (snap) => {
        if (snap.empty) return;
        const items: AcademicKeyPoint[] = [];
        snap.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
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
