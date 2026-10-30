import { registerSW } from 'virtual:pwa-register';

let deferredPrompt = null;
let isAppInstalled = false;
const installListeners = new Set();
const connectionListeners = new Set();
const pwaToastListeners = new Set();

// Check if running as standalone PWA
export function checkIsStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Check if user is on iOS Safari
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function initPWA() {
  if (typeof window === 'undefined') return;

  isAppInstalled = checkIsStandalone();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notifyInstallListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    isAppInstalled = true;
    notifyInstallListeners();
  });

  window.addEventListener('online', () => notifyConnectionListeners(true));
  window.addEventListener('offline', () => notifyConnectionListeners(false));

  // Service worker registration with VitePWA
  try {
    const updateSW = registerSW({
      onNeedRefresh() {
        notifyPwaToast({
          type: 'update',
          action: () => updateSW(true)
        });
      },
      onOfflineReady() {
        notifyPwaToast({
          type: 'ready'
        });
      }
    });
  } catch (err) {
    console.log('Service worker registration:', err);
  }
}

export function canInstall() {
  return !!deferredPrompt && !isAppInstalled;
}

export function isInstalled() {
  return isAppInstalled;
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;
  if (choiceResult.outcome === 'accepted') {
    deferredPrompt = null;
    isAppInstalled = true;
    notifyInstallListeners();
    return true;
  }
  return false;
}

export function subscribeInstall(listener) {
  installListeners.add(listener);
  return () => installListeners.delete(listener);
}

function notifyInstallListeners() {
  installListeners.forEach(fn => fn({ canInstall: canInstall(), isInstalled: isInstalled() }));
}

export function subscribeConnection(listener) {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
}

function notifyConnectionListeners(isOnline) {
  connectionListeners.forEach(fn => fn(isOnline));
}

export function subscribePwaToast(listener) {
  pwaToastListeners.add(listener);
  return () => pwaToastListeners.delete(listener);
}

export function showAppToast(data) {
  notifyPwaToast(data);
}

function notifyPwaToast(data) {
  pwaToastListeners.forEach(fn => fn(data));
}
