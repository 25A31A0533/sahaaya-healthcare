import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Share, Smartphone } from 'lucide-react';
import { canInstall, isInstalled, promptInstall, isIOS, subscribeInstall } from '../lib/pwa';
import { useLanguage } from '../context/LanguageContext';

export default function InstallBanner({ compact = false }) {
  const { t } = useLanguage();
  const [installable, setInstallable] = useState(canInstall());
  const [installed, setInstalled] = useState(isInstalled());
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    setInstallable(canInstall());
    setInstalled(isInstalled());

    const unsub = subscribeInstall(({ canInstall: c, isInstalled: i }) => {
      setInstallable(c);
      setInstalled(i);
    });

    if (isIOS() && !isInstalled()) {
      setShowIOSHint(true);
    }

    return () => unsub();
  }, []);

  const handleInstallClick = async () => {
    await promptInstall();
  };

  if (installed) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium ${compact ? '' : 'my-2'}`}>
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{t('app_installed')}</span>
      </div>
    );
  }

  if (showIOSHint) {
    return (
      <div className={`p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start gap-2.5 ${compact ? '' : 'my-2'}`}>
        <Share className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">{t('install_app')} (iOS)</p>
          <p className="mt-0.5">{t('install_hint_ios')}</p>
        </div>
      </div>
    );
  }

  if (!installable) {
    return null;
  }

  return (
    <div className={`p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-primary/20 rounded-xl shadow-sm flex items-center justify-between gap-3 ${compact ? '' : 'my-3'}`}>
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-primary text-white rounded-lg">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 leading-tight">
            {t('app_title')}
          </h4>
          <p className="text-xs text-gray-600 mt-0.5">
            {t('offline_status_desc')}
          </p>
        </div>
      </div>

      <button
        onClick={handleInstallClick}
        className="min-h-touch px-4 py-2 bg-primary hover:bg-primary-hover active:scale-95 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
        aria-label="Install Sahaaya app on your device"
      >
        <Download className="w-4 h-4" />
        <span>{t('install_app')}</span>
      </button>
    </div>
  );
}
