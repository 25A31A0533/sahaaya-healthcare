import householdsInitial from '../data/households.json';
import protocolsInitial from '../data/protocols.json';

const DB_NAME = 'sahaaya_health_db';
const DB_VERSION = 1;

let dbInstance = null;

export function closeDB() {
  if (dbInstance) {
    try {
      if (typeof dbInstance.close === 'function') {
        dbInstance.close();
      }
    } catch (_e) {
      // ignore
    }
    dbInstance = null;
  }
}

export function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('households')) {
        db.createObjectStore('households', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('protocols')) {
        db.createObjectStore('protocols', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'queueId', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = async (event) => {
      dbInstance = event.target.result;
      try {
        await seedIfFirstLaunch(dbInstance);
        resolve(dbInstance);
      } catch (err) {
        console.error('Error during database seed check:', err);
        resolve(dbInstance);
      }
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

async function seedIfFirstLaunch(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['metadata', 'households', 'protocols'], 'readwrite');
    const metaStore = tx.objectStore('metadata');
    const getReq = metaStore.get('db_seeded');

    getReq.onsuccess = () => {
      if (getReq.result && getReq.result.value === true) {
        // Already seeded on previous launch! Do NOT overwrite user modifications.
        return resolve();
      }

      // First launch: seed bundled data
      const householdStore = tx.objectStore('households');
      householdsInitial.forEach(item => householdStore.put(item));

      const protocolStore = tx.objectStore('protocols');
      protocolsInitial.forEach(item => protocolStore.put(item));

      metaStore.put({ key: 'db_seeded', value: true, seededAt: new Date().toISOString(), version: DB_VERSION });
      metaStore.put({ key: 'last_sync_time', value: new Date().toISOString() });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function getHouseholds() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('households', 'readonly');
    const store = tx.objectStore('households');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || householdsInitial);
    req.onerror = () => reject(req.error);
  });
}

export async function updateHousehold(household) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['households', 'syncQueue'], 'readwrite');
    const hStore = tx.objectStore('households');
    const qStore = tx.objectStore('syncQueue');

    hStore.put(household);

    // Idempotent sync queue check: prevent duplicate queue entries for the same completion
    const getAllReq = qStore.getAll();
    getAllReq.onsuccess = () => {
      const existing = getAllReq.result || [];
      const alreadyQueued = existing.some(
        item => item.householdId === household.id && item.status === household.patient?.status
      );

      if (!alreadyQueued) {
        qStore.add({
          action: 'UPDATE_HOUSEHOLD',
          timestamp: household.patient?.completedAt || new Date().toISOString(),
          householdId: household.id,
          patientName: household.patient?.name,
          status: household.patient?.status,
          category: household.patient?.category
        });
      }
    };

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

export async function removeSyncQueueItems(queueIds = []) {
  if (!queueIds || queueIds.length === 0) return true;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['syncQueue', 'metadata'], 'readwrite');
    const qStore = tx.objectStore('syncQueue');
    const mStore = tx.objectStore('metadata');

    queueIds.forEach(id => {
      qStore.delete(id);
    });

    mStore.put({ key: 'last_sync_time', value: new Date().toISOString() });

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getProtocols() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('protocols', 'readonly');
    const store = tx.objectStore('protocols');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || protocolsInitial);
    req.onerror = () => reject(req.error);
  });
}

export async function getSyncQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function addToSyncQueue(action, payload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    store.add({
      action,
      payload,
      timestamp: new Date().toISOString()
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearSyncQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['syncQueue', 'metadata'], 'readwrite');
    const qStore = tx.objectStore('syncQueue');
    const mStore = tx.objectStore('metadata');

    qStore.clear();
    mStore.put({ key: 'last_sync_time', value: new Date().toISOString() });

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLastSyncTime() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('metadata', 'readonly');
      const store = tx.objectStore('metadata');
      const req = store.get('last_sync_time');
      req.onsuccess = () => resolve(req.result?.value || null);
      req.onerror = () => resolve(null);
    });
  } catch (_e) {
    return null;
  }
}

export async function setLastSyncTime(isoString = new Date().toISOString()) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('metadata', 'readwrite');
      const store = tx.objectStore('metadata');
      store.put({ key: 'last_sync_time', value: isoString });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (_e) {
    return false;
  }
}

export async function getDatabaseStats() {
  try {
    const households = await getHouseholds();
    const protocols = await getProtocols();
    const syncQueue = await getSyncQueue();

    return {
      householdCount: households.length,
      protocolCount: protocols.length,
      pendingSyncCount: syncQueue.length,
      modelStatus: "CPU Rule Engine / In-browser BM25 (SLM: Inactive)",
      storageType: "IndexedDB (sahaaya_health_db)"
    };
  } catch (_err) {
    return {
      householdCount: householdsInitial.length,
      protocolCount: protocolsInitial.length,
      pendingSyncCount: 0,
      modelStatus: "CPU Rule Engine / In-browser BM25 (Memory fallback)",
      storageType: "Bundled JSON Fallback"
    };
  }
}
