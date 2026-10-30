import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw
} from 'lucide-react';
import dangerQuestions from '../data/danger_questions.json';
import outOfScopeQuestions from '../data/out_of_scope.json';
import { askClinicalAssistant } from '../lib/clinicalEngine';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function TestConsoleScreen() {
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [progress, setProgress] = useState(0);

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);

    const dangerEvaluations = [];
    const oosEvaluations = [];

    const totalQuestions = dangerQuestions.length + outOfScopeQuestions.length;
    let completed = 0;

    // 1. Run 40 Danger Questions
    for (const dq of dangerQuestions) {
      const res = await askClinicalAssistant(dq.question);
      const passed = res.type === 'danger';
      dangerEvaluations.push({
        id: dq.id,
        question: dq.question,
        category: dq.category,
        expected: 'DANGER',
        actual: res.type,
        matchedSign: res.matchedSign,
        passed,
        durationMs: res.durationMs
      });
      completed++;
      setProgress(Math.round((completed / totalQuestions) * 100));
    }

    // 2. Run 15 Out-of-Scope Questions
    for (const oos of outOfScopeQuestions) {
      const res = await askClinicalAssistant(oos.question);
      const passed = res.type === 'refusal';
      oosEvaluations.push({
        id: oos.id,
        question: oos.question,
        reason: oos.reason,
        expected: 'REFUSAL',
        actual: res.type,
        passed,
        durationMs: res.durationMs
      });
      completed++;
      setProgress(Math.round((completed / totalQuestions) * 100));
    }

    const dangerPassed = dangerEvaluations.filter(e => e.passed).length;
    const oosPassed = oosEvaluations.filter(e => e.passed).length;

    setTestResults({
      evaluatedAt: new Date().toLocaleTimeString(),
      dangerTotal: dangerQuestions.length,
      dangerPassed,
      dangerFailed: dangerQuestions.length - dangerPassed,
      dangerEvaluations,
      oosTotal: outOfScopeQuestions.length,
      oosPassed,
      oosFailed: outOfScopeQuestions.length - oosPassed,
      oosEvaluations
    });

    setIsRunning(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {t('test_console_title')}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('test_console_desc')}
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full font-mono">
            55 Questions
          </span>
        </div>

        {/* Run Test Button - 48px touch target */}
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="w-full min-h-touch py-3 px-4 bg-primary hover:bg-primary-hover active:scale-98 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{t('running_tests')} ({progress}%)</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white" />
              <span>{t('run_all_tests')}</span>
            </>
          )}
        </button>

        {isRunning && (
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-primary h-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Results Summary Cards (Responsive Grid: 1 col on mobile, 2 cols on tablet/desktop) */}
      {testResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* Danger Escalation Card */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    {t('escalation_title')}
                  </h3>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  testResults.dangerFailed === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.dangerPassed} / {testResults.dangerTotal} ({Math.round((testResults.dangerPassed / testResults.dangerTotal) * 100)}%)
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                {t('escalation_desc')}
              </p>
            </div>

            {/* List Failed Questions if any */}
            {testResults.dangerFailed > 0 ? (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2 text-xs">
                <span className="font-bold text-red-900 block">{t('failed_questions_label')}:</span>
                {testResults.dangerEvaluations.filter(e => !e.passed).map(f => (
                  <div key={f.id} className="text-red-800">
                    <span className="font-bold font-mono">[{f.id}]</span> {f.question}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('all_danger_passed')}</span>
              </div>
            )}
          </div>

          {/* Out-of-Scope Refusal Card */}
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    {t('refusal_title')}
                  </h3>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  testResults.oosFailed === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.oosPassed} / {testResults.oosTotal} ({Math.round((testResults.oosPassed / testResults.oosTotal) * 100)}%)
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                {t('refusal_desc')}
              </p>
            </div>

            {testResults.oosFailed > 0 ? (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2 text-xs">
                <span className="font-bold text-red-900 block">{t('failed_questions_label')}:</span>
                {testResults.oosEvaluations.filter(e => !e.passed).map(f => (
                  <div key={f.id} className="text-red-800">
                    <span className="font-bold font-mono">[{f.id}]</span> {f.question}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('all_refusal_passed')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
