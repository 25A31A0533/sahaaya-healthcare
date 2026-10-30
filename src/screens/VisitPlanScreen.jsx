import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Calendar,
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  Check, 
  Sparkles,
  Heart,
  Baby,
  Activity
} from 'lucide-react';
import { 
  getRankedVisits, 
  computeCategoryCounts, 
  isVisitCompleted 
} from '../lib/visitPlanner';
import { updateHousehold } from '../lib/db';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function VisitPlanScreen({ households, onHouseholdUpdated }) {
  const { t, language } = useLanguage();
  const [scheduleView, setScheduleView] = useState('pending'); // 'pending' = Visit Schedule, 'completed' = Completed Visits
  const [activeFilter, setActiveFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // Compute live category-level counts from actual household records
  const categoryCounts = computeCategoryCounts(households);

  // Current list of visits based on active schedule view ('pending' vs 'completed') and category filter
  const visits = getRankedVisits(households, activeFilter, scheduleView);

  const handleComplete = async (household) => {
    // Idempotency: prevent completing an already completed visit
    if (isVisitCompleted(household.patient) || updatingId === household.id) {
      return;
    }

    setUpdatingId(household.id);
    const completedAt = new Date().toISOString();
    const updated = {
      ...household,
      patient: {
        ...household.patient,
        status: 'Completed Today',
        isCompleted: true,
        completedAt
      }
    };

    try {
      await updateHousehold(updated);
      if (onHouseholdUpdated) {
        onHouseholdUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to update visit:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCompletionTime = (isoString) => {
    if (!isoString) return t('completed_today');
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(language === 'te' ? 'te-IN' : 'en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_e) {
      return t('completed_today');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            {t('priority_urgent')}
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-700" />
            {t('priority_overdue')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            {t('priority_due_soon')}
          </span>
        );
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Pregnant':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-pink-100 text-pink-800 border border-pink-200">
            <Heart className="w-3 h-3 text-pink-600" />
            {t('tag_pregnant')}
          </span>
        );
      case 'Child':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Baby className="w-3 h-3 text-blue-600" />
            {t('tag_child')}
          </span>
        );
      case 'NCD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Activity className="w-3 h-3 text-purple-600" />
            {t('tag_ncd')}
          </span>
        );
      default:
        return category ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700">
            {category}
          </span>
        ) : null;
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header with Title and Cluster */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {t('nav_visits')}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('cluster')}
            </p>
          </div>
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full font-mono">
            {categoryCounts.all.pending} {t('pending_label')} • {categoryCounts.all.completed} {t('completed')}
          </span>
        </div>

        {/* Primary Schedule Navigation: Visit Schedule vs. Completed Visits */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
          <button
            onClick={() => setScheduleView('pending')}
            className={`min-h-touch py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              scheduleView === 'pending'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }`}
            aria-label={`${t('tab_visit_schedule')} (${categoryCounts.all.pending})`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('tab_visit_schedule')}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              scheduleView === 'pending' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {categoryCounts.all.pending}
            </span>
          </button>

          <button
            onClick={() => setScheduleView('completed')}
            className={`min-h-touch py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              scheduleView === 'completed'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:text-gray-900'
            }`}
            aria-label={`${t('tab_completed_visits')} (${categoryCounts.all.completed})`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{t('tab_completed_visits')}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              scheduleView === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {categoryCounts.all.completed}
            </span>
          </button>
        </div>

        {/* Category Filter Tabs with dynamic count badges */}
        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-100">
          {[
            { id: 'all', labelKey: 'filter_all', count: categoryCounts.all[scheduleView] },
            { id: 'anc', labelKey: 'filter_anc', count: categoryCounts.anc[scheduleView] },
            { id: 'imm', labelKey: 'filter_imm', count: categoryCounts.imm[scheduleView] },
            { id: 'ncd', labelKey: 'filter_ncd', count: categoryCounts.ncd[scheduleView] }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`min-h-touch py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeFilter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>{t(tab.labelKey)}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeFilter === tab.id ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {visits.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            {scheduleView === 'pending' ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {scheduleView === 'pending'
              ? t('no_pending_visits')
              : t('no_completed_visits')}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {scheduleView === 'pending'
              ? `${categoryCounts.all.completed} / ${categoryCounts.all.total} ${t('records_count_suffix')} ${t('completed')}`
              : `${categoryCounts.all.pending} ${t('pending_label')} ${t('records_count_suffix')}`}
          </p>
        </div>
      )}

      {/* Visit List (Responsive: 1 col on mobile, 2 on tablet, 3 on large screen) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {visits.map((household, index) => {
          const p = household.patient;
          const isDone = isVisitCompleted(p);
          const localizedReason = t(`reasons.${household.id}`) || p.reason;

          return (
            <div
              key={household.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                isDone 
                  ? 'bg-emerald-50/40 border-emerald-200 shadow-sm' 
                  : p.priority === 1 
                  ? 'bg-red-50/50 border-red-300 shadow-sm' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div>
                {/* Row 1: Time, Distance, Priority / Completed Status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {p.scheduled_time || `Slot ${index + 1}`}
                    </span>
                    <span className="text-gray-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {household.distance_km} km
                    </span>
                  </div>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3 h-3 text-emerald-700" />
                      {t('completed')}
                    </span>
                  ) : (
                    getPriorityBadge(p.priority)
                  )}
                </div>

                {/* Row 2: Patient Name & Household */}
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-gray-900">
                      {p.name}
                    </h3>
                    <span className="text-xs font-semibold text-primary font-mono">
                      {household.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {getCategoryBadge(p.category)}
                    {p.status && (
                      <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                        {p.status}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-1">
                    {t('head_of_family_label')}: {household.head_of_family} • <span className="font-medium text-gray-800">{household.village}</span>
                  </p>
                </div>

                {/* Row 3: Clinical Reason (Translated) */}
                <div className="mt-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-800 leading-relaxed font-medium">
                  <span className="font-bold text-primary mr-1">{t('goal_label')}:</span>
                  {localizedReason}
                </div>
              </div>

              {/* Row 4: Action Button or Completed Timestamp */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-gray-500">
                  {isDone ? (
                    <span className="font-medium text-emerald-800">
                      {t('completed_at_label')}: {formatCompletionTime(p.completedAt)}
                    </span>
                  ) : (
                    `${t('last_visit_label')}: ${p.last_visit || '2026-09'}`
                  )}
                </span>

                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>{t('completed')}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleComplete(household)}
                    disabled={updatingId === household.id}
                    className="min-h-touch px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 bg-primary hover:bg-primary-hover text-white shadow-sm disabled:opacity-50"
                    aria-label={`Mark visit completed for ${p.name}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('mark_completed')}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
