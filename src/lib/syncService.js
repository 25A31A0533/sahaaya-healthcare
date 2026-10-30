/**
 * Honest Offline Synchronization Service
 * 
 * Rules:
 * 1. Offline local saving and remote synchronization are distinct.
 * 2. Local completion always works immediately offline (persisting to IndexedDB).
 * 3. Remote synchronization can ONLY finish when a real backend is reachable.
 * 4. If no backend exists, NEVER fake an upload or claim data was synced to server.
 * 5. If synchronisation fails, the pending queue is preserved 100% intact.
 */

import { getSyncQueue, removeSyncQueueItems, setLastSyncTime } from './db';

/**
 * Returns the configured backend URL if available.
 */
export function getBackendUrl() {
  if (typeof window !== 'undefined' && window.__BACKEND_URL__) {
    return window.__BACKEND_URL__;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SYNC_BACKEND_URL) {
    return import.meta.env.VITE_SYNC_BACKEND_URL;
  }
  return null;
}

/**
 * Checks whether a remote backend is currently configured.
 */
export function isBackendConfigured() {
  return Boolean(getBackendUrl());
}

/**
 * Performs honest synchronization:
 * - If offline: rejects with OFFLINE status.
 * - If no backend: reports LOCAL_ONLY mode, preserving queue.
 * - If backend exists: POSTs to /api/sync. On 200 OK confirmation, acknowledges and removes processed items.
 *   On failure, preserves queue untouched.
 */
export async function performSync() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      success: false,
      reason: 'OFFLINE',
      message: 'Device is offline. Connect to internet to sync.'
    };
  }

  const queue = await getSyncQueue();
  if (!queue || queue.length === 0) {
    return {
      success: true,
      processedCount: 0,
      message: 'Queue is empty. All local records are up to date.'
    };
  }

  const backendUrl = getBackendUrl();

  // If no backend is configured, preserve queue honestly
  if (!backendUrl) {
    return {
      success: false,
      reason: 'NO_BACKEND',
      pendingCount: queue.length,
      queuePreserved: true,
      message: 'No remote server configured. All changes remain saved locally on this device.'
    };
  }

  // Attempt real remote sync
  const endpoint = backendUrl.endsWith('/') ? `${backendUrl}api/sync` : `${backendUrl}/api/sync`;
  const controller = typeof window !== 'undefined' && window.AbortController ? new window.AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'Sahaaya Health',
        timestamp: new Date().toISOString(),
        updates: queue
      }),
      signal: controller ? controller.signal : undefined
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      // Server confirmed receipt: remove acknowledged items
      const processedIds = data.processedIds || queue.map(q => q.queueId).filter(Boolean);
      await removeSyncQueueItems(processedIds);
      
      const now = new Date().toISOString();
      await setLastSyncTime(now);

      if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
        window.dispatchEvent(new window.CustomEvent('sahaaya_synced', {
          detail: { count: processedIds.length, time: now, success: true }
        }));
      }

      return {
        success: true,
        processedCount: processedIds.length,
        message: `Successfully synced ${processedIds.length} updates to server.`
      };
    } else {
      // Server returned error: PRESERVE queue
      return {
        success: false,
        reason: 'SERVER_ERROR',
        status: res.status,
        queuePreserved: true,
        message: `Server returned error (${res.status}). Queued updates preserved locally.`
      };
    }
  } catch (_err) {
    if (timeoutId) clearTimeout(timeoutId);
    // Network failure / timeout: PRESERVE queue
    return {
      success: false,
      reason: 'NETWORK_ERROR',
      queuePreserved: true,
      message: 'Network error or server unreachable. Updates remain saved locally and queued.'
    };
  }
}
