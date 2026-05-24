export interface QueuedScore {
  id?: number;
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
    if (this._db) {
      // Liveness check: if the connection was closed externally, reopen
      try { this._db.objectStoreNames; } catch { this._db = null; }
    }
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
          const toEvict = countReq.result - 99; // evict enough to bring below cap
          let evicted = 0;
          const cursorReq = store.openCursor();
          cursorReq.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && evicted < toEvict) {
              cursor.delete();
              evicted++;
              cursor.continue();
            } else {
              store.add({ ...score, queuedAt: Date.now() });
            }
          };
          cursorReq.onerror = () => { /* cursor eviction is best-effort */ };
        } else {
          store.add({ ...score, queuedAt: Date.now() });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async peekAll(): Promise<QueuedScore[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).getAll();
      req.onsuccess = () => resolve((req.result || []) as QueuedScore[]);
      req.onerror = () => reject(req.error);
    });
  },

  async removeItems(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      for (const id of ids) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /** Atomically remove some items and update others in a single transaction. */
  async removeAndUpdate(
    removeIds: number[],
    updates: { id: number; patch: Partial<QueuedScore> }[],
  ): Promise<void> {
    if (removeIds.length === 0 && updates.length === 0) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      for (const id of removeIds) store.delete(id);
      for (const { id, patch } of updates) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result;
          if (existing) store.put({ ...existing, ...patch });
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
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
