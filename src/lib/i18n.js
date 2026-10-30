import translations from '../data/translations.json';

let currentLanguage = (() => {
  try {
    const saved = localStorage.getItem('sahaaya_language');
    if (saved === 'en' || saved === 'te') return saved;
  } catch (_e) {
    // Ignore storage access error
  }
  return 'te';
})();

const listeners = new Set();

export function getLanguage() {
  return currentLanguage;
}

export function setInternalLanguage(lang) {
  if (lang === 'en' || lang === 'te') {
    currentLanguage = lang;
    listeners.forEach(fn => fn(currentLanguage));
  }
}

export function setLanguage(lang) {
  if (lang === 'en' || lang === 'te') {
    currentLanguage = lang;
    try {
      localStorage.setItem('sahaaya_language', lang);
    } catch (_e) {
      // Ignore storage access error
    }
    listeners.forEach(fn => fn(currentLanguage));
  }
}

export function toggleLanguage() {
  setLanguage(currentLanguage === 'te' ? 'en' : 'te');
}

export function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function t(key) {
  if (!key) return '';
  const dict = translations[currentLanguage] || translations.en;

  if (key.includes('.')) {
    const parts = key.split('.');
    let val = dict;
    for (const p of parts) {
      if (val && typeof val === 'object' && p in val) {
        val = val[p];
      } else {
        val = undefined;
        break;
      }
    }
    if (val !== undefined) return val;

    let fallbackVal = translations.en;
    for (const p of parts) {
      if (fallbackVal && typeof fallbackVal === 'object' && p in fallbackVal) {
        fallbackVal = fallbackVal[p];
      } else {
        fallbackVal = undefined;
        break;
      }
    }
    return fallbackVal !== undefined ? fallbackVal : key;
  }

  return dict[key] || translations.en[key] || key;
}
