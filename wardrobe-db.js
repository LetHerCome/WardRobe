(() => {
  const DB_NAME = 'wardrobe-local-v1';
  const DB_VERSION = 1;
  const STORE = 'garments';

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB non disponibile su questo browser'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Impossibile aprire WardRobe DB'));
    });
  }

  async function withStore(mode, action) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let result;
        try { result = action(store, tx); } catch (error) { reject(error); return; }
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error('Operazione IndexedDB fallita'));
        tx.onabort = () => reject(tx.error || new Error('Operazione IndexedDB annullata'));
      });
    } finally {
      db.close();
    }
  }

  async function listItems() {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).getAll();
        request.onsuccess = () => {
          const rows = Array.isArray(request.result) ? request.result : [];
          rows.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
          resolve(rows);
        };
        request.onerror = () => reject(request.error || new Error('Lettura WardRobe fallita'));
      });
    } finally {
      db.close();
    }
  }

  async function saveItem(item) {
    if (!item || !item.id || !item.category || !(item.imageBlob instanceof Blob)) {
      throw new Error('Capo non valido');
    }
    await withStore('readwrite', store => store.put(item));
    return item;
  }

  async function deleteItem(id) {
    if (!id) return;
    await withStore('readwrite', store => store.delete(id));
  }

  async function getItem(id) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('Lettura capo fallita'));
      });
    } finally {
      db.close();
    }
  }

  window.WardRobeDB = { listItems, saveItem, deleteItem, getItem };
})();
