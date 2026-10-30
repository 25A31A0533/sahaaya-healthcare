import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { getTelemetry } from '../lib/clinicalEngine';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function FootprintScreen() {
  const { t } = useLanguage();
  const [telemetry, setTelemetry] = useState(getTelemetry());
  const [heapMemory, setHeapMemory] = useState(null);

  useEffect(() => {
    setTelemetry(getTelemetry());

    if (typeof performance !== 'undefined' && performance.memory) {
      const usedMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
      const totalMB = (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1);
      setHeapMemory(`${usedMB} MB / ${totalMB} MB`);
    } else {
      setHeapMemory("Browser sandbox (heap unexposed)");
    }
  }, []);

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Title */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 leading-tight">
          {t('footprint_title')}
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          {t('footprint_desc')}
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 rounded-full text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t('cpu_only_badge')}</span>
        </div>
      </div>

      {/* Metrics Cards Grid (Responsive: 1 col on mobile, 2 cols on tablet/desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: App Size */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">{t('app_size_label')}</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">
              ~335 KB <span className="text-xs font-medium text-gray-500">(Precached Assets)</span>
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('app_size_sub')}
          </p>
        </div>

        {/* Card 2: Model Size */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">{t('model_size_label')}</span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-primary mt-2">
              {t('model_size_value')} <span className="text-xs font-medium text-gray-500">(BM25 Index)</span>
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
            {t('model_size_sub')}
          </p>
        </div>

        {/* Card 3: Memory Used */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">{t('memory_used_label')}</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 mt-2 font-mono">
              {heapMemory}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('memory_used_sub')}
          </p>
        </div>

        {/* Card 4: Response Latencies */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">{t('latency_label')}</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2.5">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[11px] text-gray-500 block">{t('last_query_label')}</span>
                <span className="text-lg font-black text-gray-900 font-mono">
                  {telemetry.lastDurationMs} ms
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[11px] text-gray-500 block">{t('avg_query_label')}</span>
                <span className="text-lg font-black text-primary font-mono">
                  {telemetry.avgDurationMs} ms
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-mono text-right">
            {t('latency_sub')} ({telemetry.totalQueries} queries)
          </p>
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
