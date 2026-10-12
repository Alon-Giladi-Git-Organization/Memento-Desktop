import {
  db,
  collection,
  doc,
  getDocs,
  writeBatch,
  setDoc,
  serverTimestamp,
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

    // Major Digits 0-9
    for (const d of DEFAULT_MAJOR_DIGITS) {
      const docId = String(d.number);
      const docRef = doc(db, 'major_digits', docId);
      itemsBatch.set(docRef, {
        id: docId,
        number: d.number,
        numberStr: d.numberStr,
        consonants: d.consonants,
        defaultWord: d.defaultWord,
        userWord: d.userWord || null,
        imageHint: d.imageHint,
        updatedAt: now,
      }, { merge: true });
      totalCount++;
    }

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
function getTimestampMillis(val: any): number {
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
        batch.set(docRef, { ...item, id, updatedAt: item.updatedAt || Date.now() }, { merge: true });
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
          uploadBatch.set(docRef, { ...localItem, id, updatedAt: localTime }, { merge: true });
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
        uploadBatch.set(docRef, { ...localItem, id, updatedAt: localItem.updatedAt || Date.now() }, { merge: true });
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

    // 10. Major Digits
    const digitsRes = await syncCollectionBidirectional(
      'major_digits',
      currentData.majorDigits,
      (item) => String(item.number)
    );
    stats.uploaded += digitsRes.uploadedCount;
    stats.downloaded += digitsRes.downloadedCount;

    // Sort major items by number
    const sortedMajor = [...majorRes.mergedItems].sort((a, b) => a.number - b.number);
    const sortedPao = [...paoRes.mergedItems].sort((a, b) => a.number - b.number);
    const sortedBody = [...bodyRes.mergedItems].sort((a, b) => a.index - b.index);
    const sortedShapes = [...shapeRes.mergedItems].sort((a, b) => a.number - b.number);
    const sortedDigits = [...digitsRes.mergedItems].sort((a, b) => a.number - b.number);

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
      digitsRes.error,
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
