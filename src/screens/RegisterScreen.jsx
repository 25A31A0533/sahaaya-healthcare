import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Users, 
  ChevronRight, 
  Heart, 
  Baby, 
  Activity,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function RegisterScreen({ households }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeHousehold, setActiveHousehold] = useState(null);

  const villages = ['all', 'Chinnaipalem', 'Gollalapalem', 'Ramabhadrapuram', 'Tallavalasa', 'Kothavalasa'];

  const filtered = households.filter(h => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      h.head_of_family.toLowerCase().includes(q) ||
      h.id.toLowerCase().includes(q) ||
      h.village.toLowerCase().includes(q) ||
      (h.patient && h.patient.name.toLowerCase().includes(q));

    const matchesVillage = selectedVillage === 'all' || h.village === selectedVillage;
    const matchesCategory = selectedCategory === 'all' || 
      (h.patient && h.patient.category === selectedCategory);

    return matchesSearch && matchesVillage && matchesCategory;
  });

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Pregnant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-800">
            <Heart className="w-3 h-3 text-pink-600" />
            {t('tag_pregnant')}
          </span>
        );
      case 'Child':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Baby className="w-3 h-3 text-blue-600" />
            {t('tag_child')}
          </span>
        );
      case 'NCD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <Activity className="w-3 h-3 text-purple-600" />
            {t('tag_ncd')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header and Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {t('nav_families')}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('households_desc')}
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full font-mono">
            {filtered.length} / {households.length}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full min-h-touch pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Village Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {villages.map(v => (
            <button
              key={v}
              onClick={() => setSelectedVillage(v)}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                selectedVillage === v
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {v === 'all' ? t('all_villages') : v}
            </button>
          ))}
        </div>
      </div>

      {/* Household Register List (Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((household) => {
          const p = household.patient;

          return (
            <div
              key={household.id}
              onClick={() => setActiveHousehold(household)}
              className="p-4 bg-white hover:bg-gray-50 active:bg-gray-100 rounded-2xl border border-gray-200 shadow-sm cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-primary font-mono bg-primary-light px-2 py-0.5 rounded">
                    {household.id}
                  </span>
                  {p && getCategoryBadge(p.category)}
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-2 truncate">
                  {household.head_of_family}
                </h3>

                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{household.village}</span>
                  <span className="text-gray-400">•</span>
                  <span>{household.distance_km} {t('distance_label')}</span>
                  <span className="text-gray-400">•</span>
                  <span>{household.members_count} {t('members_label')}</span>
                </p>

                {p && (
                  <div className="mt-2 text-xs text-gray-700 font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500 font-semibold">{t('service_label')}: </span>
                    <span className="text-gray-900 font-bold">{p.name}</span>
                    <span className="block text-gray-600 text-[11px] mt-0.5">{p.status}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end text-primary text-xs font-semibold gap-1">
                <span>{t('household_details_title')}</span>
                <ChevronRight className="w-4 h-4 text-primary shrink-0" />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-sm">
            {t('no_households_found')}
          </div>
        )}
      </div>

      {/* Household Details Modal */}
      {activeHousehold && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-primary font-mono bg-primary-light px-2.5 py-1 rounded">
                  {activeHousehold.id}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {activeHousehold.head_of_family}
                </h3>
                <p className="text-xs text-gray-600">
                  {activeHousehold.village} • {activeHousehold.distance_km} {t('distance_label')}
                </p>
              </div>
              <button
                onClick={() => setActiveHousehold(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full bg-gray-100"
                aria-label={t('close_button')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Details */}
            {activeHousehold.patient && (
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-950">
                    {t('key_health_need')}
                  </h4>
                  {getCategoryBadge(activeHousehold.patient.category)}
                </div>

                <div className="text-xs text-gray-800 space-y-1">
                  <p><span className="font-semibold text-gray-600">{t('patient_name_label')}:</span> {activeHousehold.patient.name}</p>
                  <p><span className="font-semibold text-gray-600">{t('status_label')}:</span> {activeHousehold.patient.status}</p>
                  {activeHousehold.patient.gestation_weeks && (
                    <p><span className="font-semibold text-gray-600">{t('gestation_label')}:</span> {activeHousehold.patient.gestation_weeks}w (EDC: {activeHousehold.patient.edc})</p>
                  )}
                  <p className="pt-1 text-gray-900 font-medium leading-relaxed bg-white/80 p-2 rounded border border-emerald-100">
                    {t(`reasons.${activeHousehold.id}`) || activeHousehold.patient.reason}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveHousehold(null)}
              className="w-full min-h-touch py-3 bg-primary text-white font-bold rounded-xl text-sm"
            >
              {t('close_button')}
            </button>
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
