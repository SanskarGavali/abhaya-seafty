// Tiny IndexedDB wrapper (no dependency) used for the offline recording queue.
const DB_NAME = "abhaya";
const DB_VERSION = 1;
const STORE = "pending_recordings";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export function idbPut<T extends { id: string }>(value: T): Promise<unknown> {
  return tx("readwrite", (s) => s.put(value) as IDBRequest<unknown>);
}

export function idbGetAll<T>(): Promise<T[]> {
  return tx("readonly", (s) => s.getAll() as IDBRequest<T[]>);
}

export function idbDelete(id: string): Promise<unknown> {
  return tx("readwrite", (s) => s.delete(id) as IDBRequest<unknown>);
}
