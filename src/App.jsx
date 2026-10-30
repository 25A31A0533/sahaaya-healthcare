import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import AskAIScreen from './screens/AskAIScreen';
import VisitPlanScreen from './screens/VisitPlanScreen';
import RegisterScreen from './screens/RegisterScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import MoreScreen from './screens/MoreScreen';
import { getHouseholds, openDB } from './lib/db';
import { computeDailyStats } from './lib/visitPlanner';
import { initPWA, showAppToast } from './lib/pwa';
import { getSyncQueue, clearSyncQueue, setLastSyncTime } from './lib/db';
import { performSync } from './lib/syncService';
import useConnectionStatus from './hooks/useConnectionStatus';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import householdsFallback from './data/households.json';

function AppContent() {
  const { t } = useLanguage();
  const { isOnline } = useConnectionStatus();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showEmergency, setShowEmergency] = useState(false);
  const [households, setHouseholds] = useState(householdsFallback);
  const [stats, setStats] = useState(computeDailyStats(householdsFallback));
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    initPWA();

    const hasSeenSplash = sessionStorage.getItem('sahaaya_splash_dismissed');
    if (hasSeenSplash) {
      setShowSplash(false);
    }

    async function initData() {
      try {
        await openDB();
        const records = await getHouseholds();
        if (records && records.length > 0) {
          setHouseholds(records);
          setStats(computeDailyStats(records));
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
      }
    }

    initData();
  }, []);

  // Requirement 3 & 4: Honest auto-sync when connection returns
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      async function triggerAutoSync() {
        try {
          const syncResult = await performSync();
          if (syncResult.success && syncResult.processedCount > 0) {
            const template = t('back_online_toast') || 'Back online — {count} updates synced';
            const msg = template.replace('{count}', syncResult.processedCount);
            showAppToast({
              type: 'sync',
              message: msg,
              duration: 5000
            });
          } else if (syncResult.reason === 'NO_BACKEND') {
            const queue = await getSyncQueue();
            if (queue.length > 0) {
              showAppToast({
                type: 'info',
                message: `${t('backend_not_configured')} (${queue.length} ${t('pending_label')})`,
                duration: 4000
              });
            }
          }
        } catch (err) {
          console.error('Auto-sync execution failed:', err);
        }
      }

      triggerAutoSync();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, t]);

  const handleStart = () => {
    sessionStorage.setItem('sahaaya_splash_dismissed', 'true');
    setShowSplash(false);
  };

  const handleHouseholdUpdated = (updatedRecord) => {
    setHouseholds(prev => {
      const next = prev.map(h => h.id === updatedRecord.id ? updatedRecord : h);
      setStats(computeDailyStats(next));
      return next;
    });
  };

  if (showSplash) {
    return (
      <main className="w-full min-h-screen bg-primary shadow-2xl relative font-sans flex justify-center">
        <div className="w-full max-w-md">
          <SplashScreen onStart={handleStart} />
        </div>
      </main>
    );
  }

  if (showEmergency) {
    return (
      <main className="w-full min-h-screen bg-emergency shadow-2xl relative font-sans">
        <EmergencyScreen onBack={() => setShowEmergency(false)} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background flex text-gray-900 font-sans antialiased overflow-x-hidden">
      {/* PWA Toasts */}
      <Toast />

      {/* Desktop/Tablet Sidebar (>= 768px) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenEmergency={() => setShowEmergency(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Mobile Header (< 768px) */}
        <div className="md:hidden">
          <Header onEmergencyClick={() => setShowEmergency(true)} />
        </div>

        {/* Content Area: centered up to 1200px (max-w-6xl) without phone frame constraint on desktop */}
        <main className="flex-1 w-full max-w-6xl mx-auto p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto notranslate" translate="no">
          {activeTab === 'home' && (
            <HomeScreen
              stats={stats}
              onNavigate={setActiveTab}
              onOpenEmergency={() => setShowEmergency(true)}
            />
          )}

          {activeTab === 'ask-ai' && (
            <AskAIScreen
              onOpenEmergency={() => setShowEmergency(true)}
            />
          )}

          {activeTab === 'visits' && (
            <VisitPlanScreen
              households={households}
              onHouseholdUpdated={handleHouseholdUpdated}
            />
          )}

          {activeTab === 'families' && (
            <RegisterScreen
              households={households}
            />
          )}

          {activeTab === 'more' && (
            <MoreScreen />
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation (< 768px) */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
