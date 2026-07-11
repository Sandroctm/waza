import { api } from './api';

const DB_NAME = 'sigecosem_offline_db';
const STORE_NAME = 'checklists';
const DB_VERSION = 1;

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tempId', autoIncrement: true });
      }
    };
  });
}

export const offlineStorage = {
  saveChecklist: async (checklist: any): Promise<number> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add({ ...checklist, fechaHora: new Date().toISOString() });

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  },

  getChecklists: async (): Promise<any[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  deleteChecklist: async (tempId: number): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(tempId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  syncChecklists: async (onProgress?: (message: string) => void): Promise<number> => {
    const checklists = await offlineStorage.getChecklists();
    if (checklists.length === 0) return 0;

    let successCount = 0;
    for (const item of checklists) {
      try {
        const { tempId, ...cleanItem } = item;
        if (onProgress) onProgress(`Sincronizando checklist para equipo ${cleanItem.equipoPlaca}...`);
        await api.createCheckList(cleanItem);
        await offlineStorage.deleteChecklist(tempId);
        successCount++;
      } catch (err) {
        console.error('Failed to sync offline checklist item:', err);
      }
    }

    return successCount;
  }
};

// Auto sync setup when network status changes to online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('Network connected. Starting automatic offline checklists synchronization...');
    try {
      const count = await offlineStorage.syncChecklists();
      if (count > 0) {
        console.log(`Successfully synchronized ${count} checklists.`);
        // Broadcast custom event so the UI can update
        window.dispatchEvent(new CustomEvent('offline-sync-complete', { detail: count }));
      }
    } catch (err) {
      console.error('Automatic checklists synchronization failed:', err);
    }
  });
}
