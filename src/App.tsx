import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';
import { RoleSwitchBanner } from './components/RoleSwitchBanner';
import { CalendarHome } from './pages/CalendarHome';
import { InterrogationsPage } from './pages/InterrogationsPage';
import { TimetablePage } from './pages/TimetablePage';
import { NoticesPage } from './pages/NoticesPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { SurveysPage } from './pages/SurveysPage';
import { RepresentationPage } from './pages/RepresentationPage';
import { ClassControlPage } from './pages/ClassControlPage';
import { AuthPage } from './pages/AuthPage';
import { ClassOnboardingPage } from './pages/ClassOnboardingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ClassHubLogo } from './components/ClassHubLogo';
import { UpdatePasswordModal } from './components/UpdatePasswordModal';
import { interrogationsAdapter, noticesAdapter, surveysAdapter } from './services/adapters';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { GraduationCap, Loader2, X } from 'lucide-react';

const getLegalRoute = (): 'privacy' | 'terms' | null => {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path === '/privacy' || hash === '#/privacy' || hash === '#privacy') return 'privacy';
  if (path === '/terms' || hash === '#/terms' || hash === '#terms') return 'terms';
  return null;
};

function AppContent() {
  const { currentUser, profile, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('calendario');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalRoute, setLegalRoute] = useState<'privacy' | 'terms' | null>(getLegalRoute());
  const [isPasswordRecoveryActive, setIsPasswordRecoveryActive] = useState(false);
  const [pendingClassCelebration, setPendingClassCelebration] = useState<{
    classId: string;
    code: string;
    name: string;
  } | null>(null);
  const [counts, setCounts] = useState({
    interrogationsCount: 0,
    noticesCount: 0,
    surveysCount: 0
  });

  // Listen for Supabase password recovery events & URL recovery tokens
  useEffect(() => {
    // 1. Check URL parameters and hash for recovery indicators
    const checkUrlForRecovery = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        hash.includes('type=recovery') ||
        hash.includes('access_token=') ||
        search.includes('reset=true') ||
        search.includes('type=recovery')
      ) {
        setIsPasswordRecoveryActive(true);
      }
    };
    checkUrlForRecovery();

    // 2. Listen for Supabase PASSWORD_RECOVERY auth event
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecoveryActive(true);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      setLegalRoute(getLegalRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setLegalRoute(getLegalRoute());
  };

  const updateCounts = async () => {
    if (!profile?.classId) return;
    try {
      const [inters, nots, surs] = await Promise.all([
        interrogationsAdapter.getInterrogations(profile.classId),
        noticesAdapter.getNotices(profile.classId),
        surveysAdapter.getSurveys(profile.classId)
      ]);

      setCounts({
        interrogationsCount: inters.filter(i => i.status === 'OPEN').length,
        noticesCount: nots.filter(n => n.priority === 'HIGH').length,
        surveysCount: surs.filter(s => s.status === 'OPEN').length
      });
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    updateCounts();
  }, [profile?.classId]);

  // 0. Public Legal Pages (Accessible without authentication)
  if (legalRoute === 'privacy') {
    return <PrivacyPage onBack={() => navigateTo('/')} />;
  }
  if (legalRoute === 'terms') {
    return <TermsPage onBack={() => navigateTo('/')} />;
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <ClassHubLogo size="xl" className="animate-pulse" />
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
            <span>Caricamento ClassHub...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated User -> Login / Register Screen
  if (!currentUser) {
    return (
      <>
        <AuthPage />
        {isPasswordRecoveryActive && (
          <UpdatePasswordModal
            onSuccess={() => {
              setIsPasswordRecoveryActive(false);
              window.history.replaceState({}, '', '/');
            }}
          />
        )}
      </>
    );
  }

  // 3. Authenticated User without Class (or pending class creation celebration) -> Class Onboarding
  if (!profile?.classId || pendingClassCelebration) {
    return (
      <>
        <ClassOnboardingPage
          initialSuccessInfo={pendingClassCelebration}
          onClassCreated={(info) => setPendingClassCelebration(info)}
          onComplete={() => setPendingClassCelebration(null)}
        />
        {isPasswordRecoveryActive && (
          <UpdatePasswordModal
            onSuccess={() => {
              setIsPasswordRecoveryActive(false);
              window.history.replaceState({}, '', '/');
            }}
          />
        )}
      </>
    );
  }

  // 4. Authenticated User with Class -> Full ClassHub Workspace (Default Home: Calendario)
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F5F7FB] text-[#0F172A] font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Update Password Modal from email reset flow */}
      {isPasswordRecoveryActive && (
        <UpdatePasswordModal
          onSuccess={() => {
            setIsPasswordRecoveryActive(false);
            window.history.replaceState({}, '', '/');
          }}
        />
      )}
      
      {/* Top Role & Status Banner */}
      <RoleSwitchBanner />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop & Tablet Sidebar (Column 1) */}
        <div className="hidden lg:block h-full">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            counts={counts}
          />
        </div>

        {/* Mobile Slide-in Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div 
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="relative w-72 max-w-[80vw] h-full bg-white z-10 shadow-2xl flex flex-col"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-sm">Spazi di Classe</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar
                    currentTab={currentTab}
                    onSelectTab={(tab) => {
                      setCurrentTab(tab);
                      setMobileMenuOpen(false);
                    }}
                    counts={counts}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dynamic Space View (Home = Calendario) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden pb-20 lg:pb-0">
          {currentTab === 'calendario' && (
            <CalendarHome onOpenInterrogationsTab={() => setCurrentTab('interrogazioni')} />
          )}
          {currentTab === 'interrogazioni' && <InterrogationsPage />}
          {currentTab === 'orario' && <TimetablePage />}
          {currentTab === 'avvisi' && <NoticesPage />}
          {currentTab === 'materiali' && <MaterialsPage />}
          {currentTab === 'sondaggi' && <SurveysPage />}
          {currentTab === 'rappresentanza' && <RepresentationPage />}
          {currentTab === 'controllo' && <ClassControlPage />}
        </div>
      </div>

      {/* Mobile Bottom Navigation for iPhone */}
      <MobileNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenMenu={() => setMobileMenuOpen(true)}
        counts={counts}
      />

      {isPasswordRecoveryActive && (
        <UpdatePasswordModal
          onSuccess={() => {
            setIsPasswordRecoveryActive(false);
            window.history.replaceState({}, '', '/');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
