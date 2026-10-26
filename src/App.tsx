import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NetworkBar, NetworkCondition, SimulationMode } from './components/NetworkBar';
import { LeftBranding } from './components/LeftBranding';
import { LoginCard, AuthMethod } from './components/LoginCard';
import { CredentialDrawer } from './components/CredentialDrawer';
import { RecoveryModal } from './components/RecoveryModal';
import { SessionView } from './components/SessionView';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { GroupAdminDashboard } from './components/GroupAdminDashboard';
import { MemberDashboard } from './components/MemberDashboard';
import { getQueuedOfflineEvents, clearQueuedOfflineEvents } from './utils/offlineAuth';
import { translations, Language } from './utils/translations';
import { ShieldCheck, KeyRound, Globe, Activity, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'GROUP_ADMIN' | 'MEMBER' | 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LOCKED';
  group_id?: string;
  group_name?: string;
}

export default function App() {
  // Language State: 'en' | 'ta' (defaults to 'en', persisted in localStorage)
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('magilir_kulu_lang');
    return saved === 'ta' || saved === 'en' ? saved : 'en';
  });

  const t = translations[lang];
  const isTamil = lang === 'ta';

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('magilir_kulu_lang', newLang);
  };

  // Network Monitoring State (Auto-Detect Signal Strength)
  const [networkCondition, setNetworkCondition] = useState<NetworkCondition>('STRONG');
  const [latencyMs, setLatencyMs] = useState<number>(45);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('REAL');
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Sync Queue State
  const [queuedSyncCount, setQueuedSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modal / Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState<boolean>(false);
  const [showLowLevelSecurityView, setShowLowLevelSecurityView] = useState<boolean>(false);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);

  // Target Email state — initialized empty, NO auto-fill
  const [currentEmail, setCurrentEmail] = useState<string>('');

  // Authenticated Session State
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [sessionAuthMethod, setSessionAuthMethod] = useState<AuthMethod>('PASSKEY');
  const [isSessionOffline, setIsSessionOffline] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const refreshQueueCount = useCallback(() => {
    const queue = getQueuedOfflineEvents();
    setQueuedSyncCount(queue.length);
  }, []);

  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount]);

  // Real-time Network Auto-Detection Probe
  const probeNetwork = useCallback(async () => {
    if (simulationMode === 'FORCE_STRONG') {
      setNetworkCondition('STRONG');
      setLatencyMs(42);
      return;
    }
    if (simulationMode === 'FORCE_WEAK') {
      setNetworkCondition('WEAK');
      setLatencyMs(680);
      return;
    }
    if (simulationMode === 'FORCE_OFFLINE') {
      setNetworkCondition('OFFLINE');
      setLatencyMs(0);
      return;
    }

    if (!navigator.onLine) {
      setNetworkCondition('OFFLINE');
      setLatencyMs(0);
      return;
    }

    setIsProbing(true);
    const start = performance.now();

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/network/status?t=' + Date.now(), {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      const rtt = Math.round(performance.now() - start);
      setLatencyMs(rtt);

      if (res.ok) {
        const data = await res.json();
        if (data.csrf_token) {
          setCsrfToken(data.csrf_token);
        }
        // Auto-classify signal strength
        if (rtt <= 450) {
          setNetworkCondition('STRONG');
        } else {
          setNetworkCondition('WEAK');
        }
      } else {
        setNetworkCondition('OFFLINE');
      }
    } catch {
      setNetworkCondition('OFFLINE');
      setLatencyMs(0);
    } finally {
      setIsProbing(false);
    }
  }, [simulationMode]);

  // Listen for browser online/offline events for immediate response
  useEffect(() => {
    const handleOnline = () => probeNetwork();
    const handleOffline = () => {
      setNetworkCondition('OFFLINE');
      setLatencyMs(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    probeNetwork();
    const interval = setInterval(() => {
      probeNetwork();
    }, 9000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [probeNetwork]);

  // Check existing session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setAuthenticatedUser(data.user);
            setSessionAuthMethod('PASSWORD');
            setIsSessionOffline(false);
            if (data.csrf_token) setCsrfToken(data.csrf_token);
          }
        }
      } catch {
        // offline
      }
    };
    checkSession();
  }, []);

  const handleTriggerSync = async () => {
    const queued = getQueuedOfflineEvents();
    if (queued.length === 0) return;

    setIsSyncing(true);
    try {
      const res = await fetch('/api/offline/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ events: queued }),
      });

      if (res.ok) {
        clearQueuedOfflineEvents();
        refreshQueueCount();
      }
    } catch (err) {
      console.error('Failed to sync offline events', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (networkCondition !== 'OFFLINE' && queuedSyncCount > 0) {
      handleTriggerSync();
    }
  }, [networkCondition, queuedSyncCount]);

  const handleLoginSuccess = (
    user: any,
    method: AuthMethod,
    isOffline: boolean
  ) => {
    setAuthenticatedUser(user);
    setSessionAuthMethod(method);
    setIsSessionOffline(isOffline);
    refreshQueueCount();
  };

  const handleLogout = async () => {
    if (!isSessionOffline) {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // offline
      }
    }
    setAuthenticatedUser(null);
    setShowLowLevelSecurityView(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Main Top Header with Brand and Top-Right Tamil/English Language Switcher */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Wordmark: SHE SHEIELD AI */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#166534] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  SHE SHEIELD AI
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300 hidden sm:inline">
                  {isTamil ? 'மகளிர் குழு' : 'Magilir Kulu'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                {isTamil ? 'தானியங்கி இணையநிலை அங்கீகாரக் கட்டமைப்பு' : 'Network-Aware Adaptive Authentication'}
              </p>
            </div>
          </div>

          {/* Center Actions */}
          <div className="flex items-center gap-2">
            {authenticatedUser && (
              <button
                type="button"
                onClick={() => setShowLowLevelSecurityView(!showLowLevelSecurityView)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  showLowLevelSecurityView
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Toggle NAAA Security Audit & Cryptographic Details"
              >
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden md:inline">
                  {showLowLevelSecurityView
                    ? isTamil ? 'டாஷ்போர்டிற்கு திரும்பு' : 'Return to Dashboard'
                    : isTamil ? 'NAAA பாதுகாப்பு தணிக்கை' : 'NAAA Security View'}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#166534]" />
              <span className="hidden sm:inline">{t.enrollDrawerButton}</span>
              <span className="sm:hidden">{isTamil ? 'சான்றுகள்' : 'Credentials'}</span>
            </button>
          </div>

          {/* Prominent Top-Right Language Switcher (Mandatory Requirement) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1 hidden sm:inline" />
              <button
                type="button"
                onClick={() => handleLanguageChange('ta')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  lang === 'ta'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-label="Switch to Tamil"
              >
                தமிழ்
              </button>
              <span className="text-slate-300 mx-0.5 font-light">|</span>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-label="Switch to English"
              >
                English
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Network Auto-Detection & Signal Strength Meter Bar */}
      <NetworkBar
        condition={networkCondition}
        latencyMs={latencyMs}
        simulationMode={simulationMode}
        onSimulationChange={(mode) => {
          setSimulationMode(mode);
          if (mode === 'FORCE_STRONG') {
            setNetworkCondition('STRONG');
            setLatencyMs(38);
          } else if (mode === 'FORCE_WEAK') {
            setNetworkCondition('WEAK');
            setLatencyMs(620);
          } else if (mode === 'FORCE_OFFLINE') {
            setNetworkCondition('OFFLINE');
            setLatencyMs(0);
          }
        }}
        onRefreshProbe={probeNetwork}
        isProbing={isProbing}
        queuedSyncCount={queuedSyncCount}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
        t={t}
        isTamil={isTamil}
      />

      {/* Main Viewport */}
      <main className="flex-1 py-6 px-4 sm:px-6">
        <div className="max-w-7xl w-full mx-auto">
          {authenticatedUser ? (
            showLowLevelSecurityView ? (
              <SessionView
                user={authenticatedUser as any}
                authMethod={sessionAuthMethod}
                isOffline={isSessionOffline}
                networkCondition={networkCondition}
                csrfToken={csrfToken}
                onLogout={handleLogout}
                t={t}
                isTamil={isTamil}
              />
            ) : authenticatedUser.role === 'SUPER_ADMIN' || authenticatedUser.role === 'ADMIN' ? (
              <SuperAdminDashboard
                user={authenticatedUser}
                csrfToken={csrfToken}
                onLogout={handleLogout}
                t={t}
                isTamil={isTamil}
              />
            ) : authenticatedUser.role === 'GROUP_ADMIN' ? (
              <GroupAdminDashboard
                user={authenticatedUser}
                csrfToken={csrfToken}
                onLogout={handleLogout}
                t={t}
                isTamil={isTamil}
              />
            ) : (
              <MemberDashboard
                user={authenticatedUser}
                csrfToken={csrfToken}
                onLogout={handleLogout}
                t={t}
                isTamil={isTamil}
              />
            )
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-4">
                {/* Left Column: Branding, Mission, and NAAA Decision Matrix */}
                <div className="lg:col-span-7">
                  <LeftBranding
                    currentCondition={networkCondition}
                    t={t}
                    isTamil={isTamil}
                  />
                </div>

                {/* Right Column: Active Strict Login & Self-Registration Card (NO AUTO-FILL) */}
                <div className="lg:col-span-5">
                  <LoginCard
                    currentCondition={networkCondition}
                    onLoginSuccess={handleLoginSuccess}
                    onOpenRecovery={() => setIsRecoveryOpen(true)}
                    onOpenEnrollment={() => setIsDrawerOpen(true)}
                    defaultEmail={currentEmail}
                    csrfToken={csrfToken}
                    t={t}
                    isTamil={isTamil}
                  />
                </div>
              </div>

              {/* Informational Role Reference (Manual Typing Only — No Autofill per instructions) */}
              <div className="max-w-4xl mx-auto mt-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowManualGuide(!showManualGuide)}
                    className="w-full flex items-center justify-between text-slate-700 font-semibold hover:text-slate-900 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-700" />
                      <span>
                        {isTamil
                          ? 'சோதனை கணக்குகள் வழிகாட்டி (கைமுறையாக உள்ளிடவும் — தானியங்கி நிரப்புதல் முடக்கப்பட்டுள்ளது)'
                          : 'Authorized Accounts Reference (Manual Entry Only — Auto-fill is disabled)'}
                      </span>
                    </span>
                    {showManualGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showManualGuide && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-slate-500 leading-relaxed">
                        {isTamil
                          ? 'கீழே உள்ள கணக்குகள் பயன்பாட்டை சோதிப்பதற்காக வழங்கப்பட்டுள்ளன. நற்சான்றிதழ்களை உள்நுழைவு படிவத்தில் நேரடியாக தட்டச்சு செய்யவும்.'
                          : 'You can test any role by manually entering the email and standard password below. Default password for all seed accounts is:'}{' '}
                        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono font-semibold">RuralShield@2026AdminSecure!</code>
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2">
                        <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200">
                          <span className="font-bold text-purple-900 block">Super Admin</span>
                          <span className="text-[11px] font-mono text-purple-700 block truncate">sherasanjayn@gmail.com</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">Full Org & Member Approval</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200">
                          <span className="font-bold text-teal-900 block">Group Admin</span>
                          <span className="text-[11px] font-mono text-teal-700 block truncate">anitha.leader@magilirkulu.org</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">Payment Queue & Loan Reviews</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                          <span className="font-bold text-blue-900 block">Active Member</span>
                          <span className="text-[11px] font-mono text-blue-700 block truncate">kavitha.member@magilirkulu.org</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">Passbook, UPI Submissions</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} SHE SHEIELD AI — {isTamil ? 'மகளிர் குழு' : 'Magilir Kulu'}</span>
          <span className="font-mono text-[11px] text-slate-400">
            {isTamil ? 'அங்கீகரிக்கப்பட்ட மாநில ஒருங்கிணைப்பாளர்: sherasanjayn@gmail.com' : 'State Coordinator: sherasanjayn@gmail.com'}
          </span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CredentialDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        defaultEmail={currentEmail}
        onSelectEmail={(e) => setCurrentEmail(e)}
        t={t}
        isTamil={isTamil}
        csrfToken={csrfToken}
      />

      <RecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        t={t}
        isTamil={isTamil}
      />
    </div>
  );
}
