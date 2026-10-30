import React from 'react';
import { Wifi, WifiOff, Globe, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import useConnectionStatus from '../hooks/useConnectionStatus';

export default function Header({ onEmergencyClick }) {
  const { language, toggleLanguage, t } = useLanguage();
  const { isOnline } = useConnectionStatus();

  return (
    <header className="sticky top-0 z-40 bg-primary text-white shadow-md border-b border-primary-dark">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Left: App Title & Status Badge */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold tracking-tight">
              {t('app_title')}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isOnline ? 'bg-emerald-800 text-emerald-100' : 'bg-amber-900/80 text-amber-200 border border-amber-600/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-300" /> : <WifiOff className="w-3 h-3 text-amber-300" />}
              <span className="truncate max-w-[150px] sm:max-w-none">{isOnline ? t('online_badge') : t('offline_badge')}</span>
            </span>
          </div>
        </div>

        {/* Right: Language Toggle & Emergency Shortcut */}
        <div className="flex items-center gap-2 notranslate" translate="no">
          {/* Language Toggle Button - 48px touch target */}
          <button
            onClick={toggleLanguage}
            className="min-h-touch min-w-touch px-3.5 py-1.5 bg-primary-dark hover:bg-primary-hover active:scale-95 text-xs font-bold rounded-lg border border-emerald-600/40 flex items-center gap-1.5 transition-all text-white shadow-sm"
            aria-label="Toggle Language between Telugu and English"
          >
            <Globe className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-semibold">{language === 'te' ? 'English' : 'తెలుగు'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
