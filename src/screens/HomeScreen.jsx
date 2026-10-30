import React from 'react';
import { 
  Calendar, 
  MessageSquare, 
  AlertTriangle, 
  Users, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import useConnectionStatus from '../hooks/useConnectionStatus';
import InstallBanner from '../components/InstallBanner';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function HomeScreen({ 
  stats, 
  onNavigate, 
  onOpenEmergency 
}) {
  const { language, t } = useLanguage();
  const { isOnline } = useConnectionStatus();

  const todayFormatted = new Date().toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Network Status Top Banner */}
      <div className={`p-3 rounded-xl border flex items-center justify-between shadow-sm transition-colors ${
        isOnline ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
          }`} />
          <span className={`text-xs font-bold flex items-center gap-1.5 ${
            isOnline ? 'text-emerald-950' : 'text-amber-950'
          }`}>
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            {isOnline ? t('online_badge') : t('offline_badge')}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-white/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
          {t('facility_tag')}
        </span>
      </div>

      {/* Greeting and Today's Date */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {t('greeting')}
            </h2>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              {t('role')} • {t('phc_location')}
            </p>
          </div>
          <div className="self-start sm:self-auto px-2.5 py-1 bg-white/10 rounded-lg text-xs font-medium text-emerald-100 border border-white/10">
            {todayFormatted}
          </div>
        </div>

        {/* Emergency Shortcut Button */}
        <button
          onClick={onOpenEmergency}
          className="mt-4 w-full min-h-touch py-2.5 px-4 bg-emergency hover:bg-emergency-dark active:scale-98 text-white font-bold rounded-xl shadow-md flex items-center justify-between text-sm transition-all border border-red-400"
          aria-label={t('emergency_button')}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <span>{t('emergency_button')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/80" />
        </button>
      </div>

      {/* Stat Cards Grid (Responsive: 2 cols on mobile, 4 cols on tablet/desktop) */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
          {t('today_priorities')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Visits Scheduled */}
          <div 
            onClick={() => onNavigate('visits')}
            className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-primary transition-all active:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">{t('stat_household_visits')}</span>
              <div className="p-1.5 bg-emerald-50 text-primary rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">
              {stats.scheduledVisits}
            </p>
            <span className="text-[11px] text-gray-500 mt-0.5 block">{t('stat_sub_villages')}</span>
          </div>

          {/* Card 2: Urgent Alerts */}
          <div 
            onClick={() => onNavigate('visits')}
            className="bg-red-50/70 p-3.5 rounded-xl border border-red-200 shadow-sm cursor-pointer hover:border-emergency transition-all active:bg-red-100/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emergency-dark">{t('stat_urgent')}</span>
              <div className="p-1.5 bg-red-100 text-emergency rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emergency mt-2">
              {stats.urgentAlerts}
            </p>
            <span className="text-[11px] text-red-700 mt-0.5 block font-medium">{t('stat_sub_urgent')}</span>
          </div>

          {/* Card 3: Immunisations Due */}
          <div 
            onClick={() => onNavigate('visits')}
            className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-primary transition-all active:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">{t('stat_immunisation')}</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">
              {stats.immunisationsDue}
            </p>
            <span className="text-[11px] text-gray-500 mt-0.5 block">{t('stat_sub_children')}</span>
          </div>

          {/* Card 4: Follow-ups Due */}
          <div 
            onClick={() => onNavigate('visits')}
            className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-primary transition-all active:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">{t('stat_followups')}</span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">
              {stats.followupsDue}
            </p>
            <span className="text-[11px] text-gray-500 mt-0.5 block">{t('stat_sub_ncd')}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Cards (Responsive: 1 col on mobile, 2 cols on tablet/desktop) */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
          {t('quick_actions')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ask AI Action */}
          <button
            onClick={() => onNavigate('ask-ai')}
            className="w-full p-4 bg-white hover:bg-gray-50 active:scale-99 border border-gray-200 rounded-xl shadow-sm flex items-center justify-between text-left transition-all"
            aria-label={t('nav_ask_ai')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-light text-primary rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t('nav_ask_ai')}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{t('ask_ai_desc')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Households Action */}
          <button
            onClick={() => onNavigate('families')}
            className="w-full p-4 bg-white hover:bg-gray-50 active:scale-99 border border-gray-200 rounded-xl shadow-sm flex items-center justify-between text-left transition-all"
            aria-label={t('nav_families')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t('nav_families')}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{t('households_desc')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* In-app Install Banner */}
      <InstallBanner />

      {/* Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
}
