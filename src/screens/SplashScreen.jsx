import React from 'react';
import { HeartPulse, MapPin, Building2, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function SplashScreen({ onStart }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary-dark to-[#043327] text-white flex flex-col justify-between px-6 py-8">
      {/* Top Branding */}
      <div className="flex flex-col items-center text-center pt-8">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-4 border-2 border-emerald-400/40">
          <HeartPulse className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          {t('app_title')}
        </h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-xs font-medium">
          {t('app_subtitle')}
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full mt-4 text-xs font-semibold text-emerald-200 border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>{t('offline_status_desc')}</span>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white/95 text-gray-900 rounded-2xl p-5 shadow-2xl backdrop-blur-sm border border-white/40 my-6 max-w-md mx-auto w-full">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              Sunitha Devi
            </h2>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              {t('role')}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 mt-3 text-xs text-gray-700">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-gray-900">{t('assigned_facility')}</span>
              <span>{t('phc_location')}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-gray-900">{t('village_cluster')}</span>
              <span className="text-gray-600 leading-relaxed">{t('cluster')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="space-y-3 pb-4 max-w-md mx-auto w-full">
        <button
          onClick={onStart}
          className="w-full min-h-touch py-3.5 px-6 bg-amber-400 hover:bg-amber-300 active:scale-98 text-gray-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-base transition-all"
          aria-label={t('get_started')}
        >
          <span>{t('get_started')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-[11px] text-emerald-200/80">
          {t('disclaimer')}
        </p>
      </div>
    </div>
  );
}
