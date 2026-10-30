import React, { useState } from 'react';
import { 
  RefreshCw, 
  Wrench, 
  ChevronRight, 
  ArrowLeft
} from 'lucide-react';
import SyncScreen from './SyncScreen';
import EvaluatorToolsScreen from './EvaluatorToolsScreen';
import InstallBanner from '../components/InstallBanner';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useLanguage } from '../context/LanguageContext';

export default function MoreScreen() {
  const { t } = useLanguage();
  const [activeSubView, setActiveSubView] = useState(null); // 'sync' | 'evaluator_tools'

  if (activeSubView === 'sync') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveSubView(null)}
          className="min-h-touch px-2 py-1 flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back_to_more')}</span>
        </button>
        <SyncScreen />
      </div>
    );
  }

  if (activeSubView === 'evaluator_tools') {
    return (
      <EvaluatorToolsScreen onBack={() => setActiveSubView(null)} />
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Profile Card */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
          SD
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 leading-tight">
            Sunitha Devi
          </h2>
          <p className="text-xs text-primary font-semibold mt-0.5">
            {t('role')} • {t('phc_location')}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {t('cluster')}
          </p>
        </div>
      </div>

      {/* Install Banner */}
      <InstallBanner />

      {/* Menu Options */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {/* Option 1: Offline Data & Sync */}
        <button
          onClick={() => setActiveSubView('sync')}
          className="w-full min-h-[64px] p-4 flex items-center justify-between text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {t('offline_data_title')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('offline_data_desc')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Option 2: Evaluator tools (System Footprint & Test Console) */}
        <button
          onClick={() => setActiveSubView('evaluator_tools')}
          className="w-full min-h-[64px] p-4 flex items-center justify-between text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {t('evaluator_tools_title')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('evaluator_tools_desc')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
