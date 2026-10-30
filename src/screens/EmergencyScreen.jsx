import React from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  ShieldAlert, 
  HeartCrack, 
  Baby, 
  Flame, 
  Wind, 
  Eye, 
  Activity, 
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function EmergencyScreen({ onBack }) {
  const { language, t } = useLanguage();

  const maternalSigns = [
    {
      title: language === 'te' ? "రక్తస్రావం (Vaginal Bleeding)" : "Vaginal Bleeding in Pregnancy",
      english: "Bleeding in pregnancy or labor",
      action: language === 'te' 
        ? "ఎడమవైపు పడుకోబెట్టండి. యోనిలో గుడ్డలు పెట్టవద్దు. వెంటనే 108 కి కాల్ చేయండి."
        : "Position woman on left lateral side. Do not pack vagina. Transport immediately via 108 ambulance.",
      icon: HeartCrack
    },
    {
      title: language === 'te' ? "మూర్ఛ / ఫిట్స్ (Fits & Convulsions)" : "Fits / Convulsions / Eclampsia",
      english: "Eclampsia / Seizures",
      action: language === 'te'
        ? "శ్వాస మార్గం శుభ్రం చేయండి. నోట్లో ఏమీ పెట్టవద్దు. రోగిని ఒంటరిగా వదలకండి."
        : "Clear airway, do not put anything in mouth, keep warm, transport urgently via 108.",
      icon: Activity
    },
    {
      title: language === 'te' ? "తీవ్రమైన తలనొప్పి & చూపు మందగించడం" : "Severe Headache with Blurred Vision",
      english: "Severe headache / Blurred vision",
      action: language === 'te'
        ? "రక్తపోటు (BP) తనిఖీ చేయండి. కాంతి తక్కువగా ఉన్న ప్రదేశంలో ఉంచండి."
        : "Measure blood pressure immediately. Screen for pre-eclampsia. Refer to Kothavalasa PHC.",
      icon: Eye
    },
    {
      title: language === 'te' ? "తీవ్రమైన కడుపు నొప్పి (Severe Abdominal Pain)" : "Severe Abdominal Pain in Pregnancy",
      english: "Continuous sharp uterine pain",
      action: language === 'te'
        ? "నొప్పి మాత్రలు ఇవ్వవద్దు. రోగి కదలకుండా పడుకోబెట్టి తక్షణమే ఆసుపత్రికి తరలించండి."
        : "Do not give painkiller tablets. Keep patient immobilized and transport immediately.",
      icon: ShieldAlert
    },
    {
      title: language === 'te' ? "బిడ్డ కదలికలు లేకపోవడం (>12 గంటలు)" : "Absent Fetal Movement (>12 hours)",
      english: "No fetal movement for >12 hours",
      action: language === 'te'
        ? "తల్లికి తియ్యని పానీయం ఇచ్చి ఎడమవైపు 1 గంట పడుకోబెట్టండి. కదలిక లేకపోతే వెంటనే PHC కి పంపండి."
        : "Give sweet drink, lie on left side for 1 hour. If still absent, refer immediately for Doppler check.",
      icon: Baby
    },
    {
      title: language === 'te' ? "తీవ్ర జ్వరం & ఒంటిపై దద్దుర్లు (Fever with Rash)" : "High Fever with Rash / Stiff Neck",
      english: "High fever with rash or stiff neck",
      action: language === 'te'
        ? "సాధారణ నీటితో శరీరం తుడవండి (Tepid sponging). ఐస్ వాడవద్దు."
        : "Perform room-temperature sponging. Check for neck stiffness. Refer for meningitis evaluation.",
      icon: Flame
    },
    {
      title: language === 'te' ? "తీవ్రమైన శ్వాస ఆడకపోవడం (Difficulty Breathing)" : "Severe Difficulty Breathing",
      english: "Severe breathlessness at rest",
      action: language === 'te'
        ? "కూర్చునే భంగిమలో ఉంచండి. బిగుతుగా ఉన్న బట్టలు వదులు చేయండి."
        : "Keep patient in upright sitting posture, loosen tight clothing, refer with oxygen support.",
      icon: Wind
    }
  ];

  const newbornSigns = [
    {
      title: language === 'te' ? "పాలు తాగలేకపోవడం (Inability to Suck)" : "Inability to Suck or Feed",
      action: language === 'te'
        ? "శిశువుకు పాలు తాగే శక్తి లేకపోవడం తీవ్ర ఇన్ఫెక్షన్ సంకేతం. వెంటనే SNCU కి పంపండి."
        : "Sign of neonatal sepsis or hypothermia. Urgent transfer to Kothavalasa PHC / SNCU."
    },
    {
      title: language === 'te' ? "శరీరం చల్లబడిపోవడం (Cold to Touch / Hypothermia)" : "Hypothermia (Cold to Touch)",
      action: language === 'te'
        ? "వెంటనే కంగారూ మదర్ కేర్ (KMC) ద్వారా తల్లి ఛాతీపై చర్మానికి చర్మం తగిలేలా ఉంచి వెచ్చగా ఉంచండి."
        : "Immediate Kangaroo Mother Care (KMC) skin-to-skin contact. Keep warm and refer to SNCU."
    },
    {
      title: language === 'te' ? "రొమ్ము లోపలికి పోవడం & వేగంగా శ్వాస (>60/ని)" : "Chest Indrawing & Fast Breathing (>60/min)",
      action: language === 'te'
        ? "ఛాతీ గూడు లోపలికి లాగడం న్యుమోనియా సంకేతం. ఆక్సిజన్ సదుపాయం ఉన్న PHC కి తరలించండి."
        : "Sign of severe pneumonia or respiratory distress. Immediate oxygen-supported transfer."
    },
    {
      title: language === 'te' ? "అరచేతులు & అరికాళ్ళు పసుపుపచ్చగా మారడం (Severe Jaundice)" : "Severe Jaundice (Yellow Palms / Soles)",
      action: language === 'te'
        ? "తొలి వారంలో కాళ్ళు పసుపుగా మారితే తీవ్ర కామెర్లు. ఫోటోథెరపీ అవసరం."
        : "Yellow palms/soles in first week indicates critical neonatal jaundice requiring phototherapy."
    },
    {
      title: language === 'te' ? "బొడ్డు నుండి చీము కారడం (Umbilical Pus / Redness)" : "Pus or Foul Odor from Umbilical Cord",
      action: language === 'te'
        ? "బొడ్డుపై ఏమీ రాయవద్దు. స్వచ్ఛమైన కాటన్ గుడ్డతో పొడిగా ఉంచి ఆసుపత్రికి పంపండి."
        : "Do not apply cow dung or ash. Keep clean and dry, transfer immediately for antibiotic treatment."
    }
  ];

  return (
    <div className="min-h-screen bg-emergency text-white flex flex-col justify-between pb-16">
      {/* Red Alert Header */}
      <div className="p-4 bg-emergency-dark/80 backdrop-blur-sm sticky top-0 z-30 border-b border-red-500/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="min-h-touch min-w-touch p-2 -ml-2 rounded-lg hover:bg-white/10 active:scale-95 flex items-center justify-center"
              aria-label={t('back_to_home')}
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-300 animate-pulse" />
            <div>
              <h1 className="text-lg font-black tracking-tight leading-tight">
                {t('emergency_button')}
              </h1>
              <p className="text-[11px] text-red-200">
                {t('emergency_header_sub')}
              </p>
            </div>
          </div>
        </div>

        <span className="text-xs font-bold bg-white text-emergency px-2.5 py-1 rounded-full uppercase shadow">
          {t('ambulance_108')}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4 flex-1 overflow-y-auto">
        {/* Referral Callout Box */}
        <div className="p-4 bg-white text-gray-900 rounded-2xl shadow-xl border-2 border-yellow-400">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-red-100 text-emergency rounded-xl shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-emergency uppercase tracking-wider block">
                {t('immediate_referral_facility')}:
              </span>
              <h2 className="text-base font-black text-gray-950 mt-0.5">
                {t('kothavalasa_facility_name')}
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {t('kothavalasa_facility_sub')}
              </p>

              {/* Call 108 Action Button alongside referral text */}
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2.5">
                <a
                  href="tel:108"
                  className="min-h-touch py-2.5 px-5 bg-emergency hover:bg-emergency-dark text-white font-bold text-sm rounded-xl shadow flex items-center justify-center gap-2 active:scale-98 transition-all"
                  aria-label="Call 108 Ambulance"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{t('call_108_btn')} ({t('ambulance_108')})</span>
                </a>
                <span className="text-xs text-gray-600 font-medium">
                  {t('refer_phc')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Maternal Danger Signs List */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-yellow-300" />
            <span>{t('emergency_maternal_title')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {maternalSigns.map((sign, idx) => {
              const Icon = sign.icon;
              return (
                <div 
                  key={idx}
                  className="p-3.5 bg-white/95 text-gray-900 rounded-xl shadow border border-red-200 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-red-100 text-emergency rounded-lg shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-950 leading-tight">
                        {sign.title}
                      </h4>
                      <p className="text-xs font-medium text-red-700 mt-0.5">
                        {sign.english}
                      </p>
                      <p className="text-xs text-gray-700 mt-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium">
                        <span className="font-bold text-primary mr-1">{t('asha_action_label')}:</span>
                        {sign.action}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Newborn Danger Signs List */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Baby className="w-4 h-4 text-yellow-300" />
            <span>{t('emergency_newborn_title')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {newbornSigns.map((sign, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-white/95 text-gray-900 rounded-xl shadow border border-red-200"
              >
                <h4 className="text-xs font-bold text-red-950">
                  • {sign.title}
                </h4>
                <p className="text-xs text-gray-700 mt-1 pl-3 font-medium">
                  {sign.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Button */}
      <div className="p-4 bg-emergency-dark border-t border-red-600/50 sticky bottom-0">
        <div className="max-w-md mx-auto">
          <button
            onClick={onBack}
            className="w-full min-h-touch py-3.5 px-4 bg-white text-emergency-dark hover:bg-gray-100 active:scale-98 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
          >
            <span>{t('back_to_home')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
