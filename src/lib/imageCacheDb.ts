/**
 * IndexedDB high-capacity local storage for PAO and Major base64 images.
 * Solves the 5MB localStorage QuotaExceededError that occurs around ~24 base64 images,
 * ensuring all 100 PAO images and 100 Major images load instantaneously offline and on startup.
 * Scoped strictly per authenticated userId so the default DB never shows any images.
 */

const DB_NAME = 'memento_visual_cache_db';
const DB_VERSION = 1;
const STORE_NAME = 'item_images';

function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImagesMapToIndexedDb(
  namespace: 'pao' | 'major',
  imagesByNumber: Record<number, string>,
  userId?: string | null
): Promise<void> {
  // Never cache images for unauthenticated / default DB
  if (!userId || userId === 'system_default' || userId === 'offline-local-user') {
    return;
  }
  try {
    const db = await openImageDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const [numStr, url] of Object.entries(imagesByNumber)) {
        if (url && typeof url === 'string' && url.trim().length > 0 && url !== 'null') {
          store.put(url, `${namespace}_${userId}_${numStr}`);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB Image Cache] Failed to save images:', err);
  }
}

export async function loadImagesMapFromIndexedDb(
  namespace: 'pao' | 'major',
  userId?: string | null
): Promise<Record<number, string>> {
  // Default DB / unauthenticated visitors must see 0 images
  if (!userId || userId === 'system_default' || userId === 'offline-local-user') {
    return {};
  }
  try {
    const db = await openImageDb();
    return await new Promise<Record<number, string>>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const result: Record<number, string> = {};
      const userPrefix = `${namespace}_${userId}_`;
      const legacyPrefix = `${namespace}_`;

      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          const key = String(cursor.key);
          if (key.startsWith(userPrefix)) {
            const num = parseInt(key.slice(userPrefix.length), 10);
            if (!isNaN(num) && typeof cursor.value === 'string' && cursor.value.trim().length > 0 && cursor.value !== 'null') {
              result[num] = cursor.value;
            }
          } else if (key.startsWith(legacyPrefix)) {
            // Check if this is a legacy unscoped key like "pao_24" (only digits after namespace_)
            const suffix = key.slice(legacyPrefix.length);
            if (/^\d+$/.test(suffix)) {
              const num = parseInt(suffix, 10);
              if (!isNaN(num) && typeof cursor.value === 'string' && cursor.value.trim().length > 0 && cursor.value !== 'null') {
                if (!result[num]) {
                  result[num] = cursor.value;
                }
                // Migrate legacy key to user-scoped key and remove unscoped key
                store.put(cursor.value, `${userPrefix}${num}`);
                store.delete(key);
              }
            }
          }
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  } catch (err) {
    console.warn('[IndexedDB Image Cache] Failed to load images:', err);
    return {};
  }
}
