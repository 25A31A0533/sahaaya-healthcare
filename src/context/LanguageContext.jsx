import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../data/translations.json';
import { setInternalLanguage, subscribeLanguage } from '../lib/i18n';

const LanguageContext = createContext();

const STORAGE_KEY = 'sahaaya_language';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'te') return saved;
    } catch (_e) {
      // localStorage may fail in private mode
    }
    return 'te'; // Default to Telugu as specified
  });

  useEffect(() => {
    // Keep lib/i18n synced with React state
    setInternalLanguage(language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (_e) {}

    // Enforce HTML attributes to block browser auto-translation
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('translate', 'no');
      document.documentElement.classList.add('notranslate');
      if (document.body) {
        document.body.classList.add('notranslate');
      }
    }
  }, [language]);

  // Keep state synchronized with storage events and i18n changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'en' || e.newValue === 'te')) {
        setLanguageState(prev => (prev === e.newValue ? prev : e.newValue));
      }
    };

    const unsub = subscribeLanguage((newLang) => {
      if (newLang === 'en' || newLang === 'te') {
        setLanguageState(prev => (prev === newLang ? prev : newLang));
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'te') {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (_e) {}
      setInternalLanguage(lang);
      setLanguageState(lang);
    }
  };

  const toggleLanguage = () => {
    const next = language === 'te' ? 'en' : 'te';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_e) {}
    setInternalLanguage(next);
    setLanguageState(next);
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    if (!key) return '';

    // Support nested lookup if key contains dot e.g. "reasons.KV-001"
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

      // Fallback to English
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
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
