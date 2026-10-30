import { useState, useEffect, useCallback } from 'react';

// Shared state across all component instances
let globalIsOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
const listeners = new Set();
let isChecking = false;

function setOnlineState(newStatus) {
  if (globalIsOnline !== newStatus) {
    globalIsOnline = newStatus;
    listeners.forEach((fn) => fn(globalIsOnline));
  }
}

export async function verifyRealConnectivity() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setOnlineState(false);
    return false;
  }

  if (isChecking) return globalIsOnline;
  isChecking = true;

  try {
    const controller = typeof window !== 'undefined' && window.AbortController ? new window.AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 2000) : null;
    // Tiny same-origin request with no-store to confirm uplink
    const res = await fetch(`./favicon.svg?_p=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    });
    if (timer) clearTimeout(timer);
    const reachable = res.ok || res.status === 304;
    setOnlineState(reachable);
    isChecking = false;
    return reachable;
  } catch (_err) {
    // Treat network error / abort as offline
    setOnlineState(false);
    isChecking = false;
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // Set tentatively to true, then confirm
    setOnlineState(true);
    verifyRealConnectivity();
  });

  window.addEventListener('offline', () => {
    setOnlineState(false);
  });
}

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(globalIsOnline);

  useEffect(() => {
    setIsOnline(globalIsOnline);
    listeners.add(setIsOnline);
    return () => {
      listeners.delete(setIsOnline);
    };
  }, []);

  const checkConnectivity = useCallback(() => {
    return verifyRealConnectivity();
  }, []);

  return { isOnline, checkRealConnectivity: checkConnectivity };
}

export default useConnectionStatus;
