import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import sampleHouseholds from '../data/households.json';
import { 
  getRankedVisits, 
  computeDailyStats, 
  computeCategoryCounts, 
  isVisitCompleted 
} from '../lib/visitPlanner';
import { 
  openDB, 
  closeDB, 
  getHouseholds, 
  updateHousehold, 
  getSyncQueue, 
  clearSyncQueue 
} from '../lib/db';
import { 
  performSync, 
  getBackendUrl, 
  isBackendConfigured 
} from '../lib/syncService';

/**
 * Lightweight in-memory IndexedDB polyfill for Node.js Vitest environment
 */
function createInMemoryIDB() {
  const databases = new Map();

  return {
    open(dbName, version) {
      const req = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: null
      };

      setTimeout(() => {
        let dbData = databases.get(dbName);
        let isUpgradeNeeded = false;
        if (!dbData) {
          dbData = {
            version,
            stores: new Map()
          };
          databases.set(dbName, dbData);
          isUpgradeNeeded = true;
        }

        const db = {
          name: dbName,
          version,
          objectStoreNames: {
            contains(storeName) {
              return dbData.stores.has(storeName);
            }
          },
          createObjectStore(storeName, options = {}) {
            if (!dbData.stores.has(storeName)) {
              dbData.stores.set(storeName, {
                options,
                records: new Map(),
                autoId: 1
              });
            }
            return {};
          },
          transaction(_storeNames, mode) {
            const tx = {
              mode,
              oncomplete: null,
              onerror: null,
              onabort: null,
              error: null,
              objectStore(name) {
                const store = dbData.stores.get(name);
                if (!store) throw new Error(`Object store ${name} not found`);

                return {
                  put(item) {
                    const keyPath = store.options.keyPath;
                    let key = item[keyPath];
                    if (key === undefined && store.options.autoIncrement) {
                      key = store.autoId++;
                      item[keyPath] = key;
                    }
                    store.records.set(key, JSON.parse(JSON.stringify(item)));
                    const r = { onsuccess: null, onerror: null, result: key };
                    setTimeout(() => { if (r.onsuccess) r.onsuccess({ target: r }); }, 0);
                    return r;
                  },
                  add(item) {
                    return this.put(item);
                  },
                  get(key) {
                    const r = { onsuccess: null, onerror: null, result: null };
                    setTimeout(() => {
                      const item = store.records.get(key);
                      r.result = item ? JSON.parse(JSON.stringify(item)) : undefined;
                      if (r.onsuccess) r.onsuccess({ target: r });
                    }, 0);
                    return r;
                  },
                  getAll() {
                    const r = { onsuccess: null, onerror: null, result: [] };
                    setTimeout(() => {
                      r.result = Array.from(store.records.values()).map(v => JSON.parse(JSON.stringify(v)));
                      if (r.onsuccess) r.onsuccess({ target: r });
                    }, 0);
                    return r;
                  },
                  delete(key) {
                    const r = { onsuccess: null, onerror: null };
                    setTimeout(() => {
                      store.records.delete(key);
                      if (r.onsuccess) r.onsuccess({ target: r });
                    }, 0);
                    return r;
                  },
                  clear() {
                    const r = { onsuccess: null, onerror: null };
                    setTimeout(() => {
                      store.records.clear();
                      if (r.onsuccess) r.onsuccess({ target: r });
                    }, 0);
                    return r;
                  }
                };
              }
            };

            // Trigger tx.oncomplete asynchronously after operations execute
            setTimeout(() => {
              if (tx.oncomplete) tx.oncomplete();
            }, 10);

            return tx;
          },
          close() {
            // Close connection
          }
        };

        if (isUpgradeNeeded && req.onupgradeneeded) {
          req.onupgradeneeded({ target: { result: db } });
        }

        req.result = db;
        if (req.onsuccess) {
          req.onsuccess({ target: req });
        }
      }, 0);

      return req;
    }
  };
}

describe('Sahaaya Health — Visit Management & Offline Sync Verification', () => {
  let originalIDB;
  let originalFetch;

  beforeEach(() => {
    originalIDB = globalThis.indexedDB;
    originalFetch = globalThis.fetch;
    globalThis.indexedDB = createInMemoryIDB();
    closeDB();
  });

  afterEach(() => {
    closeDB();
    globalThis.indexedDB = originalIDB;
    globalThis.fetch = originalFetch;
    if (typeof window !== 'undefined') {
      delete window.__BACKEND_URL__;
    }
  });

  // 1. Initial State: 30 pending, 0 completed
  it('Scenario 1: Initial state has exactly 30 pending visits and 0 completed visits', () => {
    const counts = computeCategoryCounts(sampleHouseholds);
    const stats = computeDailyStats(sampleHouseholds);

    expect(counts.all.total).toBe(30);
    expect(counts.all.pending).toBe(30);
    expect(counts.all.completed).toBe(0);
    expect(stats.scheduledVisits).toBe(30);
    expect(stats.completedVisits).toBe(0);

    const pending = getRankedVisits(sampleHouseholds, 'all', 'pending');
    const completed = getRankedVisits(sampleHouseholds, 'all', 'completed');
    expect(pending.length).toBe(30);
    expect(completed.length).toBe(0);
  });

  // 2. Marking 1 visit complete: pending drops 30 -> 29, completed increases 0 -> 1
  it('Scenario 2: Marking 1 visit complete drops pending from 30 to 29 and increases completed to 1', () => {
    const modified = JSON.parse(JSON.stringify(sampleHouseholds));
    modified[0].patient.status = 'Completed Today';
    modified[0].patient.isCompleted = true;
    modified[0].patient.completedAt = new Date().toISOString();

    const counts = computeCategoryCounts(modified);
    const stats = computeDailyStats(modified);

    expect(counts.all.pending).toBe(29);
    expect(counts.all.completed).toBe(1);
    expect(counts.all.total).toBe(30);
    expect(stats.scheduledVisits).toBe(29);
    expect(stats.completedVisits).toBe(1);

    const pending = getRankedVisits(modified, 'all', 'pending');
    const completed = getRankedVisits(modified, 'all', 'completed');
    expect(pending.length).toBe(29);
    expect(completed.length).toBe(1);
    expect(completed[0].id).toBe(modified[0].id);
  });

  // 3. Mathematical Invariant: pending + completed === total at all times
  it('Scenario 3: Mathematical Invariant: pending + completed === total across completions', () => {
    const list = JSON.parse(JSON.stringify(sampleHouseholds));

    // Complete 5 random visits
    for (let i = 0; i < 5; i++) {
      list[i * 4].patient.status = 'Completed Today';
      list[i * 4].patient.isCompleted = true;
      list[i * 4].patient.completedAt = new Date().toISOString();
    }

    const counts = computeCategoryCounts(list);
    const stats = computeDailyStats(list);

    expect(counts.all.pending + counts.all.completed).toBe(counts.all.total);
    expect(counts.anc.pending + counts.anc.completed).toBe(counts.anc.total);
    expect(counts.imm.pending + counts.imm.completed).toBe(counts.imm.total);
    expect(counts.ncd.pending + counts.ncd.completed).toBe(counts.ncd.total);
    expect(stats.scheduledVisits + stats.completedVisits).toBe(stats.totalScheduled);
    expect(stats.scheduledVisits).toBe(25);
    expect(stats.completedVisits).toBe(5);
  });

  // 4. ANC Visit Completion
  it('Scenario 4: Completing an ANC visit updates ANC pending/completed without altering other categories', () => {
    const initialCounts = computeCategoryCounts(sampleHouseholds);
    const list = JSON.parse(JSON.stringify(sampleHouseholds));

    const ancIdx = list.findIndex(h => h.patient.category === 'Pregnant');
    expect(ancIdx).toBeGreaterThanOrEqual(0);

    list[ancIdx].patient.status = 'Completed Today';
    list[ancIdx].patient.isCompleted = true;
    list[ancIdx].patient.completedAt = new Date().toISOString();

    const newCounts = computeCategoryCounts(list);
    expect(newCounts.anc.pending).toBe(initialCounts.anc.pending - 1);
    expect(newCounts.anc.completed).toBe(1);
    expect(newCounts.imm.pending).toBe(initialCounts.imm.pending);
    expect(newCounts.ncd.pending).toBe(initialCounts.ncd.pending);
  });

  // 5. Immunisation Visit Completion
  it('Scenario 5: Completing an Immunisation visit reduces immunisationsDue count', () => {
    const initialStats = computeDailyStats(sampleHouseholds);
    const list = JSON.parse(JSON.stringify(sampleHouseholds));

    const childIdx = list.findIndex(h => h.patient.category === 'Child');
    expect(childIdx).toBeGreaterThanOrEqual(0);

    list[childIdx].patient.status = 'Completed Today';
    list[childIdx].patient.isCompleted = true;
    list[childIdx].patient.completedAt = new Date().toISOString();

    const newStats = computeDailyStats(list);
    expect(newStats.immunisationsDue).toBe(initialStats.immunisationsDue - 1);
  });

  // 6. NCD Visit Completion
  it('Scenario 6: Completing an NCD visit reduces followupsDue count', () => {
    const initialStats = computeDailyStats(sampleHouseholds);
    const list = JSON.parse(JSON.stringify(sampleHouseholds));

    const ncdIdx = list.findIndex(h => h.patient.category === 'NCD');
    expect(ncdIdx).toBeGreaterThanOrEqual(0);

    list[ncdIdx].patient.status = 'Completed Today';
    list[ncdIdx].patient.isCompleted = true;
    list[ncdIdx].patient.completedAt = new Date().toISOString();

    const newStats = computeDailyStats(list);
    expect(newStats.followupsDue).toBe(initialStats.followupsDue - 1);
  });

  // 7. Urgent Alert (Priority 1) Visit Completion
  it('Scenario 7: Completing a Priority 1 Urgent Risk visit reduces urgentAlerts count', () => {
    const initialStats = computeDailyStats(sampleHouseholds);
    const list = JSON.parse(JSON.stringify(sampleHouseholds));

    const p1Idx = list.findIndex(h => h.patient.priority === 1);
    expect(p1Idx).toBeGreaterThanOrEqual(0);

    list[p1Idx].patient.status = 'Completed Today';
    list[p1Idx].patient.isCompleted = true;
    list[p1Idx].patient.completedAt = new Date().toISOString();

    const newStats = computeDailyStats(list);
    expect(newStats.urgentAlerts).toBe(initialStats.urgentAlerts - 1);
  });

  // 8. Idempotency: Duplicate completions do not duplicate or corrupt counts
  it('Scenario 8: Idempotency check: completing an already-completed visit does not corrupt counts or duplicate', () => {
    const list = JSON.parse(JSON.stringify(sampleHouseholds));
    list[0].patient.status = 'Completed Today';
    list[0].patient.isCompleted = true;
    list[0].patient.completedAt = new Date().toISOString();

    const count1 = computeCategoryCounts(list);
    // Attempt second completion
    list[0].patient.status = 'Completed Today';
    list[0].patient.isCompleted = true;
    const count2 = computeCategoryCounts(list);

    expect(count1.all.pending).toBe(count2.all.pending);
    expect(count1.all.completed).toBe(count2.all.completed);
    expect(getRankedVisits(list, 'all', 'completed').length).toBe(1);
  });

  // 9. Filter Switching preserves pending vs completed separation
  it('Scenario 9: Category filtering preserves pending vs completed separation', () => {
    const list = JSON.parse(JSON.stringify(sampleHouseholds));
    // Complete 1 Pregnant and 1 Child
    const ancIdx = list.findIndex(h => h.patient.category === 'Pregnant');
    const immIdx = list.findIndex(h => h.patient.category === 'Child');

    list[ancIdx].patient.status = 'Completed Today';
    list[ancIdx].patient.isCompleted = true;
    list[immIdx].patient.status = 'Completed Today';
    list[immIdx].patient.isCompleted = true;

    const ancPending = getRankedVisits(list, 'anc', 'pending');
    const ancCompleted = getRankedVisits(list, 'anc', 'completed');
    expect(ancCompleted.length).toBe(1);
    expect(ancPending.every(h => !isVisitCompleted(h.patient))).toBe(true);

    const immPending = getRankedVisits(list, 'imm', 'pending');
    const immCompleted = getRankedVisits(list, 'imm', 'completed');
    expect(immCompleted.length).toBe(1);
    expect(immPending.every(h => !isVisitCompleted(h.patient))).toBe(true);
  });

  // 10. IndexedDB Local Persistence across simulated app restart
  it('Scenario 10: Local IndexedDB persistence preserves completed status across database close and reopen', async () => {
    await openDB();
    const initialRecords = await getHouseholds();
    expect(initialRecords.length).toBe(30);

    // Mark first household completed and update in IndexedDB
    const target = JSON.parse(JSON.stringify(initialRecords[0]));
    target.patient.status = 'Completed Today';
    target.patient.isCompleted = true;
    target.patient.completedAt = new Date().toISOString();

    await updateHousehold(target);

    // Simulate app restart: close connection and clear cached instance
    closeDB();

    // Reopen database
    await openDB();
    const reloaded = await getHouseholds();
    const saved = reloaded.find(h => h.id === target.id);

    expect(saved).toBeDefined();
    expect(saved.patient.status).toBe('Completed Today');
    expect(saved.patient.isCompleted).toBe(true);
    expect(isVisitCompleted(saved.patient)).toBe(true);
  });

  // 11. Honest Offline Sync: No remote server configured preserves queue
  it('Scenario 11: Honest Sync: when no backend is configured, queue is preserved and NO upload is faked', async () => {
    await openDB();
    await clearSyncQueue();

    const target = {
      id: 'KV-0001',
      head_of_family: 'Test Head',
      patient: { name: 'Test Patient', status: 'Completed Today', category: 'Pregnant' }
    };
    await updateHousehold(target);

    const queueBefore = await getSyncQueue();
    expect(queueBefore.length).toBe(1);

    expect(isBackendConfigured()).toBe(false);
    expect(getBackendUrl()).toBeNull();

    // Trigger sync
    const result = await performSync();
    expect(result.success).toBe(false);
    expect(result.reason).toBe('NO_BACKEND');
    expect(result.queuePreserved).toBe(true);

    // Queue must remain 100% intact!
    const queueAfter = await getSyncQueue();
    expect(queueAfter.length).toBe(1);
    expect(queueAfter[0].householdId).toBe('KV-0001');
  });

  // 12. Honest Sync: Server Error (500) preserves queue
  it('Scenario 12: Honest Sync: server 500 error preserves queue intact', async () => {
    await openDB();
    await clearSyncQueue();

    const target = {
      id: 'KV-0002',
      head_of_family: 'Test Head 2',
      patient: { name: 'Patient 2', status: 'Completed Today', category: 'Child' }
    };
    await updateHousehold(target);

    // Mock configured backend returning 500
    if (typeof window === 'undefined') {
      globalThis.window = {};
    }
    globalThis.window.__BACKEND_URL__ = 'https://api.example.org';

    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' })
    });

    const result = await performSync();
    expect(result.success).toBe(false);
    expect(result.reason).toBe('SERVER_ERROR');
    expect(result.queuePreserved).toBe(true);

    const queue = await getSyncQueue();
    expect(queue.length).toBe(1);
  });

  // 13. Backend Sync Confirmation: Deletes only acknowledged items
  it('Scenario 13: Backend Sync Confirmation: removes only acknowledged queue items upon 200 OK', async () => {
    await openDB();
    await clearSyncQueue();

    await updateHousehold({
      id: 'KV-0003',
      head_of_family: 'Test Head 3',
      patient: { name: 'Patient 3', status: 'Completed Today', category: 'NCD' }
    });

    const queue = await getSyncQueue();
    expect(queue.length).toBe(1);
    const queueId = queue[0].queueId;

    globalThis.window.__BACKEND_URL__ = 'https://api.example.org';
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        processedIds: [queueId]
      })
    });

    const result = await performSync();
    expect(result.success).toBe(true);
    expect(result.processedCount).toBe(1);

    const queueAfter = await getSyncQueue();
    expect(queueAfter.length).toBe(0);
  });

  // 14. Performance & Scalability Benchmark
  it('Scenario 14: Dynamic counts & priority ranking across 500 households executes in <15ms', () => {
    const villages = ["Chinnaipalem", "Gollalapalem", "Ramabhadrapuram", "Tallavalasa", "Kothavalasa"];
    const categories = [["Pregnant", 1], ["Child", 2], ["NCD", 3], ["Postnatal", 1], ["Child", 3]];
    
    const households500 = [];
    for (let i = 1; i <= 500; i++) {
      const [cat, prio] = categories[i % categories.length];
      const isDone = i % 5 === 0; // 100 completed, 400 pending
      households500.push({
        id: `KV-${String(i).padStart(4, '0')}`,
        head_of_family: `Head ${i}`,
        village: villages[i % villages.length],
        distance_km: 0.5 + (i % 30) * 0.1,
        patient: {
          name: `Patient ${i}`,
          category: cat,
          priority: prio,
          status: isDone ? 'Completed Today' : 'Pending',
          isCompleted: isDone,
          completedAt: isDone ? new Date().toISOString() : null,
          reason: `Checkup ${i}`,
          scheduled_time: "09:00 AM"
        }
      });
    }

    const t0 = performance.now();
    const counts500 = computeCategoryCounts(households500);
    const stats500 = computeDailyStats(households500);
    const pending500 = getRankedVisits(households500, 'all', 'pending');
    const completed500 = getRankedVisits(households500, 'all', 'completed');
    const duration = performance.now() - t0;

    expect(counts500.all.total).toBe(500);
    expect(counts500.all.pending).toBe(400);
    expect(counts500.all.completed).toBe(100);
    expect(stats500.scheduledVisits).toBe(400);
    expect(stats500.completedVisits).toBe(100);
    expect(pending500.length).toBe(400);
    expect(completed500.length).toBe(100);
    expect(duration).toBeLessThan(15);
  });
});
