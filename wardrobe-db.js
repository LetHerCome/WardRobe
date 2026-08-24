(() => {
  const DB_NAME = 'wardrobe-local-v1';
  const DB_VERSION = 2;
  const STORE = 'garments';
  const PROFILE_STORE = 'profile';
  const AVATAR_KEY = 'main-avatar';

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
        if (!db.objectStoreNames.contains(PROFILE_STORE)) {
          db.createObjectStore('profile', { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Impossibile aprire WardRobe DB'));
    });
  }

  async function withStore(storeName, mode, action) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
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
    await withStore(STORE, 'readwrite', store => store.put(item));
    return item;
  }

  async function deleteItem(id) {
    if (!id) return;
    await withStore(STORE, 'readwrite', store => store.delete(id));
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

  async function getAvatarProfile() {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(PROFILE_STORE, 'readonly').objectStore(PROFILE_STORE).get(AVATAR_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('Lettura personaggio fallita'));
      });
    } finally {
      db.close();
    }
  }

  async function saveAvatarProfile(profile) {
    if (!profile || !['demo', 'personal'].includes(profile.mode)) throw new Error('Profilo personaggio non valido');
    if (profile.mode === 'personal' && !(profile.imageBlob instanceof Blob)) throw new Error('Foto personaggio non valida');
    const record = { ...profile, key: AVATAR_KEY, updatedAt: Number(profile.updatedAt || Date.now()) };
    await withStore(PROFILE_STORE, 'readwrite', store => store.put(record));
    return record;
  }

  async function clearAvatarProfile() {
    await withStore(PROFILE_STORE, 'readwrite', store => store.delete(AVATAR_KEY));
  }

  window.WardRobeDB = {
    listItems, saveItem, deleteItem, getItem,
    getAvatarProfile, saveAvatarProfile, clearAvatarProfile
  };
})();
