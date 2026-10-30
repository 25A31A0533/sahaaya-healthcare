import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DisclaimerBanner({ showSampleNotice = true }) {
  const { t } = useLanguage();

  return (
    <div className="w-full my-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed shadow-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">
            {t('disclaimer')}
          </p>
          {showSampleNotice && (
            <p className="text-[11px] text-amber-800 mt-0.5 opacity-90">
              {t('sample_data_banner')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
