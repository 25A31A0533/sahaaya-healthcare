import React from 'react';
import { 
  Home, 
  MessageSquare, 
  Calendar, 
  Users, 
  MoreHorizontal, 
  Shield, 
  AlertTriangle,
  Globe,
  User,
  HeartPulse,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import useConnectionStatus from '../hooks/useConnectionStatus';

export default function Sidebar({ activeTab, onSelectTab, onOpenEmergency }) {
  const { language, toggleLanguage, t } = useLanguage();
  const { isOnline } = useConnectionStatus();

  const navItems = [
    { id: 'home', labelKey: 'nav_home', icon: Home },
    { id: 'ask-ai', labelKey: 'nav_ask_ai', icon: MessageSquare },
    { id: 'visits', labelKey: 'nav_visits', icon: Calendar },
    { id: 'families', labelKey: 'nav_families', icon: Users },
    { id: 'more', labelKey: 'nav_more', icon: MoreHorizontal },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-gray-200 min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-black text-gray-900 tracking-tight leading-tight">
            {t('app_title')}
          </h1>
          <p className="text-[11px] text-gray-500 font-medium">
            {t('facility_tag')} PHC • Rural Vizag
          </p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 mx-3 my-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
            SD
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-gray-900 truncate">
              {t('greeting')}
            </h2>
            <p className="text-[11px] text-primary font-semibold truncate">
              {t('role')}
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status Badge */}
      <div className={`mx-3 mb-2 px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
        isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-2 truncate">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="truncate">{isOnline ? t('online_badge') : t('offline_badge')}</span>
        </div>
        {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full min-h-touch px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
              aria-label={t(item.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Emergency Button & Language Switch */}
      <div className="p-4 border-t border-gray-100 space-y-2.5">
        <button
          onClick={onOpenEmergency}
          className="w-full min-h-touch py-2.5 px-3 bg-emergency hover:bg-emergency-dark active:scale-98 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs transition-all"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-300" />
          <span>{t('emergency_button')}</span>
        </button>

        <button
          onClick={toggleLanguage}
          className="w-full min-h-touch py-2 px-3 bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 font-bold rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-xs transition-all notranslate"
          translate="no"
          aria-label="Toggle Language between Telugu and English"
        >
          <Globe className="w-4 h-4 text-primary" />
          <span>{language === 'te' ? 'English' : 'తెలుగు'}</span>
        </button>
      </div>
    </aside>
  );
}
