export interface QueuedScore {
  score: number;
  initials: string;
  mode: string;
  tick?: number;
  attempts?: number;
  nextRetry?: number;
  queuedAt?: number;
  [key: string]: unknown;
}

export const idb = {
  DB_NAME: 'dtp-offline-queue',
  STORE: 'scores',
  _db: null as IDBDatabase | null,

  async open(): Promise<IDBDatabase> {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          db.createObjectStore(this.STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => {
        this._db = req.result;
        this._db.onclose = () => { this._db = null; };
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async enqueue(score: QueuedScore): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result >= 100) {
          store.openCursor().onsuccess = (e) => {
            (e.target as IDBRequest<IDBCursorWithValue>).result?.delete();
          };
        }
        store.add({ ...score, queuedAt: Date.now() });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async dequeueAll(): Promise<QueuedScore[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []) as QueuedScore[];
        store.clear();
        tx.oncomplete = () => resolve(items);
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async count(): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  close() {
    this._db?.close();
    this._db = null;
  }
};
