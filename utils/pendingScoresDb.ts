const DB_NAME = 'dtp-pending-scores';
const STORE_NAME = 'pendingScores';
const DB_VERSION = 1;

export interface PendingScore {
  id: number;
  score: number;
  initials: string;
  mode: string;
  badge?: string;
  date: string;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;

export function openPendingScoresDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addPendingScore(scoreData: Omit<PendingScore, 'id' | 'timestamp'>) {
  const db = await openPendingScoresDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const entry: PendingScore = {
    ...scoreData,
    id: Date.now(),
    timestamp: Date.now()
  };

  return new Promise<void>((resolve, reject) => {
    const req = store.add(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllPendingScores(): Promise<PendingScore[]> {
  const db = await openPendingScoresDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePendingScore(id: number) {
  const db = await openPendingScoresDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  return new Promise<void>((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
