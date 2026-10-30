import React, { useState } from 'react';
import { ArrowLeft, Cpu, CheckSquare } from 'lucide-react';
import FootprintScreen from './FootprintScreen';
import TestConsoleScreen from './TestConsoleScreen';
import { useLanguage } from '../context/LanguageContext';

export default function EvaluatorToolsScreen({ onBack }) {
  const { t } = useLanguage();
  const [subTab, setSubTab] = useState('footprint'); // 'footprint' | 'test-console'

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="min-h-touch px-2 py-1 flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back_to_more')}</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">
            {t('evaluator_tools_title')}
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            {t('evaluator_tools_desc')}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setSubTab('footprint')}
            className={`min-h-touch py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              subTab === 'footprint'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{t('footprint_title')}</span>
          </button>

          <button
            onClick={() => setSubTab('test-console')}
            className={`min-h-touch py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              subTab === 'test-console'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{t('test_console_title')}</span>
          </button>
        </div>
      </div>

      {/* Active Sub-Screen */}
      {subTab === 'footprint' ? <FootprintScreen /> : <TestConsoleScreen />}
    </div>
  );
}
