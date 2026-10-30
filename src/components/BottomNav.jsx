import React from 'react';
import { Home, MessageSquare, Calendar, Users, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNav({ activeTab, onSelectTab }) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'home', labelKey: 'nav_home', icon: Home },
    { id: 'ask-ai', labelKey: 'nav_ask_ai', icon: MessageSquare },
    { id: 'visits', labelKey: 'nav_visits', icon: Calendar },
    { id: 'families', labelKey: 'nav_families', icon: Users },
    { id: 'more', labelKey: 'nav_more', icon: MoreHorizontal },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-mobile mx-auto flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 min-h-[54px] min-w-touch flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors active:bg-gray-100 ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-gray-600 hover:text-gray-900 font-medium'
              }`}
              aria-label={t(tab.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-primary-light text-primary' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[13px] leading-tight mt-0.5 truncate max-w-full ${
                isActive ? 'text-primary font-bold' : 'text-gray-600'
              }`}>
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
