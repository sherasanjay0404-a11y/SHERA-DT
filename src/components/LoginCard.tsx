import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  HardDriveDownload,
  Shield,
  Loader2,
  Wifi,
  WifiOff,
  UserPlus,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { NetworkCondition } from './NetworkBar';
import { authenticateWithPasskey } from '../utils/webauthn';
import { verifyOfflinePin, getStoredDeviceLease } from '../utils/offlineAuth';
import { Translations } from '../utils/translations';

export type AuthMethod = 'PASSKEY' | 'TOTP' | 'OFFLINE_PIN' | 'PASSWORD';

interface LoginCardProps {
  currentCondition: NetworkCondition;
  onLoginSuccess: (user: any, method: AuthMethod, isOffline: boolean) => void;
  onOpenRecovery: () => void;
  onOpenEnrollment: () => void;
  defaultEmail?: string;
  csrfToken?: string;
  t: Translations;
  isTamil: boolean;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  currentCondition,
  onLoginSuccess,
  onOpenRecovery,
  onOpenEnrollment,
  csrfToken,
  t,
  isTamil,
}) => {
  // Mode: LOGIN vs REGISTER
  const [viewMode, setViewMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state — NO auto-fill
  const [email, setEmail] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [offlinePin, setOfflinePin] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingApprovalAlert, setPendingApprovalAlert] = useState<boolean>(false);

  // Clear feedback on condition or mode change
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingApprovalAlert(false);
  }, [currentCondition, viewMode]);

  useEffect(() => {
    const remembered = localStorage.getItem('magilir_kulu_email');
    if (remembered) {
      setEmail(remembered);
      setRememberEmail(true);
    }
  }, []);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (rememberEmail) {
      localStorage.setItem('magilir_kulu_email', val);
    }
  };

  const handleRememberToggle = (checked: boolean) => {
    setRememberEmail(checked);
    if (checked && email) {
      localStorage.setItem('magilir_kulu_email', email);
    } else {
      localStorage.removeItem('magilir_kulu_email');
    }
  };

  // 1. Strong Network: Passkey WebAuthn Authentication
  const handlePasskeyAuth = async () => {
    if (currentCondition === 'OFFLINE') {
      setErrorMsg(isTamil ? 'இணையமில்லா முறையில் Passkey-ஐப் பயன்படுத்த முடியாது.' : 'Cannot use Passkey in offline mode.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg(isTamil ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingApprovalAlert(false);

    try {
      const optRes = await fetch('/api/webauthn/login/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!optRes.ok) {
        throw new Error(isTamil ? 'சேவையகத்திலிருந்து சவால் பெற முடியவில்லை.' : 'Failed to obtain challenge from server.');
      }
      const options = await optRes.json();

      let assertion;
      try {
        assertion = await authenticateWithPasskey(options);
      } catch (webAuthnErr: any) {
        if (webAuthnErr.name === 'NotAllowedError') {
          throw new Error(isTamil ? 'Passkey சரிபார்ப்பு ரத்து செய்யப்பட்டது.' : 'Passkey verification cancelled.');
        }
        throw new Error(webAuthnErr.message || (isTamil ? 'Passkey அங்கீகாரம் தோல்வியடைந்தது.' : 'Passkey assertion failed.'));
      }

      const verifyRes = await fetch('/api/webauthn/login/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          challenge_key: options.challenge_key,
          credential: assertion,
          network_state: currentCondition,
        }),
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        if (data.status === 'PENDING' || data.error === 'ACCOUNT_PENDING_APPROVAL') {
          setPendingApprovalAlert(true);
          return;
        }
        throw new Error(data.message || t.authFailed);
      }

      setSuccessMsg(isTamil ? 'Passkey மூலம் வெற்றிகரமாக உள்நுழைந்துள்ளீர்கள்.' : 'Passkey verified successfully.');
      onLoginSuccess(data.user, 'PASSKEY', false);
    } catch (err: any) {
      setErrorMsg(err.message || t.authFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Weak Network: TOTP (RFC 6238) Authentication
  const handleTotpAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentCondition === 'OFFLINE') {
      setErrorMsg(isTamil ? 'இணையமில்லா முறையில் TOTP சரிபார்க்க முடியாது.' : 'Cannot verify TOTP while offline.');
      return;
    }

    if (!email.trim() || !totpCode.trim()) {
      setErrorMsg(isTamil ? 'மின்னஞ்சல் மற்றும் 6-இலக்க குறியீடு தேவை.' : 'Email and 6-digit TOTP code are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingApprovalAlert(false);

    try {
      const res = await fetch('/api/totp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: totpCode.trim(),
          network_state: currentCondition,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.status === 'PENDING' || data.error === 'ACCOUNT_PENDING_APPROVAL') {
          setPendingApprovalAlert(true);
          return;
        }
        throw new Error(data.message || (isTamil ? 'தவறான TOTP குறியீடு.' : 'Invalid TOTP code.'));
      }

      setSuccessMsg(isTamil ? 'TOTP குறியீடு சரிபார்க்கப்பட்டது.' : 'TOTP verified successfully.');
      onLoginSuccess(data.user, 'TOTP', false);
    } catch (err: any) {
      setErrorMsg(err.message || t.authFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Offline Mode: Trusted Device PIN Authentication
  const handleOfflinePinAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !offlinePin.trim()) {
      setErrorMsg(isTamil ? 'மின்னஞ்சல் மற்றும் சாதன PIN தேவை.' : 'Email and local device PIN are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await verifyOfflinePin(offlinePin.trim(), email.trim());
      if (!result.success || !result.user) {
        throw new Error(result.error || (isTamil ? 'சாதன PIN சரிபார்ப்பு தோல்வியடைந்தது.' : 'Offline PIN verification failed.'));
      }

      setSuccessMsg(t.locallyVerifiedTag);
      onLoginSuccess(result.user, 'OFFLINE_PIN', true);
    } catch (err: any) {
      setErrorMsg(err.message || t.authFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Permitted Password Login Flow (Empty inputs, clean typing)
  const handlePasswordAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentCondition === 'OFFLINE') {
      setErrorMsg(isTamil ? 'இணைப்பு இல்லாதபோது கடவுச்சொல்லைச் சரிபார்க்க முடியாது.' : 'Cannot verify password offline.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg(isTamil ? 'மின்னஞ்சல் மற்றும் கடவுச்சொல் தேவை.' : 'Email and password required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingApprovalAlert(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          network_state: currentCondition,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.status === 'PENDING' || data.error === 'ACCOUNT_PENDING_APPROVAL') {
          setPendingApprovalAlert(true);
          return;
        }
        throw new Error(data.message || (isTamil ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.' : 'Invalid credentials.'));
      }

      setSuccessMsg(isTamil ? 'வெற்றிகரமாக அங்கீகரிக்கப்பட்டது.' : 'Authenticated successfully.');
      onLoginSuccess(data.user, 'PASSWORD', false);
    } catch (err: any) {
      setErrorMsg(err.message || t.authFailed);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Member Self-Registration Flow (Enforces Admin Approval)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setErrorMsg(isTamil ? 'அனைத்து கட்டாய புலங்களையும் நிரப்பவும்.' : 'Please fill all required registration fields.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          phone: regPhone.trim(),
          village: regVillage.trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (isTamil ? 'பதிவு தோல்வியடைந்தது.' : 'Registration failed.'));
      }

      setRegSuccess(true);
      setEmail(regEmail.trim().toLowerCase());
    } catch (err: any) {
      setErrorMsg(err.message || (isTamil ? 'பதிவு செய்ய முடியவில்லை.' : 'Could not submit registration.'));
    } finally {
      setIsLoading(false);
    }
  };

  const storedLease = getStoredDeviceLease();

  // If in Member Self-Registration View
  if (viewMode === 'REGISTER') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={() => {
            setViewMode('LOGIN');
            setRegSuccess(false);
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.backToLogin}</span>
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-5 h-5 text-[#166534]" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t.registerTab}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {t.registerSubtitle}
          </p>
        </div>

        {/* Success Confirmation Banner */}
        {regSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  {isTamil ? 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!' : 'Application Submitted!'}
                </h3>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  {t.registerSuccessMsg}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-lg border border-emerald-100 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900">{regName}</div>
              <div className="text-slate-600 font-mono text-[11px]">{regEmail}</div>
              <div className="text-amber-800 font-semibold flex items-center gap-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>{t.pendingApprovalBanner}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewMode('LOGIN');
                setRegSuccess(false);
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer text-center"
            >
              {t.backToLogin}
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {errorMsg && (
              <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t.fullNameLabel} *
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder={isTamil ? 'உதாரணம்: மாலதி குமார்' : 'e.g. Malathi Kumar'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#166534] focus:outline-hidden"
              />
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t.phoneLabel} *
              </label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder={isTamil ? '+91 98765 43210' : '+91 98765 43210'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#166534] focus:outline-hidden"
              />
            </div>

            {/* Village / Panchayat */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t.villageLabel}
              </label>
              <input
                type="text"
                value={regVillage}
                onChange={(e) => setRegVillage(e.target.value)}
                placeholder={isTamil ? 'கிராமம் / ஊர்' : 'Village or Town Panchayat'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#166534] focus:outline-hidden"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t.emailLabel} *
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="malathi.member@magilirkulu.org"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#166534] focus:outline-hidden"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t.passwordLabel} *
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-[#166534] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Admin Approval Notice */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {isTamil
                  ? 'பதிவு செய்த பிறகு, மகளிர் குழு ஒருங்கிணைப்பாளர் / நிர்வாகி உங்கள் விண்ணப்பத்தை சரிபார்த்து ஒப்புதல் அளிப்பார்.'
                  : 'Registrations are held in PENDING queue and require Super Admin or Group Admin verification before login is permitted.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isTamil ? 'சமர்ப்பிக்கிறது...' : 'Submitting Application...'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{t.registerSubmitBtn}</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setViewMode('LOGIN')}
                className="text-xs text-[#166534] hover:underline font-semibold cursor-pointer"
              >
                {t.alreadyRegistered}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // LOGIN VIEW
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-md w-full mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#166534]" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t.welcomeBack}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          {t.verifySubtitle}
        </p>
      </div>

      {/* Network Status & Strict Decision Enforcement Banner */}
      <div
        className={`mb-5 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
          currentCondition === 'STRONG'
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : currentCondition === 'WEAK'
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : 'bg-blue-50/80 border-blue-300 text-blue-950'
        }`}
      >
        {currentCondition === 'OFFLINE' ? (
          <WifiOff className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        ) : (
          <Wifi className={`w-4 h-4 shrink-0 mt-0.5 ${currentCondition === 'STRONG' ? 'text-emerald-600' : 'text-amber-600'}`} />
        )}
        <div className="space-y-0.5">
          <div className="font-bold flex items-center gap-1.5">
            <span>
              {currentCondition === 'STRONG' && t.networkBadgeStrong}
              {currentCondition === 'WEAK' && t.networkBadgeWeak}
              {currentCondition === 'OFFLINE' && t.networkBadgeOffline}
            </span>
            <span className="text-[10px] font-normal opacity-75 font-mono">
              [Auto-Selected]
            </span>
          </div>
          <p className="leading-relaxed opacity-90">
            {currentCondition === 'STRONG' && t.networkDescStrong}
            {currentCondition === 'WEAK' && t.networkDescWeak}
            {currentCondition === 'OFFLINE' && t.networkDescOffline}
          </p>
        </div>
      </div>

      {/* Pending Admin Approval Warning Banner */}
      {pendingApprovalAlert && (
        <div
          role="alert"
          className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5 animate-in fade-in"
        >
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t.pendingApprovalBanner}</span>
          </div>
          <p className="leading-relaxed">
            {isTamil
              ? 'உங்கள் உறுப்பினர் பதிவு சமர்ப்பிக்கப்பட்டுள்ளது. மாநில ஒருங்கிணைப்பாளர் அல்லது குழு தலைவர் ஒப்புதல் அளித்தவுடன் கணக்கை அணுகலாம்.'
              : 'Your registration is currently in the PENDING queue. A Super Admin or Group Admin must verify and approve your account before login is allowed.'}
          </p>
        </div>
      )}

      {/* Alerts */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{successMsg}</span>
        </div>
      )}

      {/* Primary Input: Email Address (NO auto-fill) */}
      <div className="mb-5">
        <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {t.emailLabel}
        </label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder={t.emailPlaceholder}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#166534] focus:border-transparent transition-all placeholder:text-slate-400"
          autoComplete="email webauthn"
        />
        <div className="flex items-center justify-between mt-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => handleRememberToggle(e.target.checked)}
              className="rounded border-slate-300 text-[#166534] focus:ring-[#166534]"
            />
            <span>{t.rememberEmail}</span>
          </label>
        </div>
      </div>

      {/* =========================================================================
          STRICT AUTOMATICALLY SELECTED AUTHENTICATION INTERFACE
          (NO MANUAL TABS OR SWITCHING CONTROLS PER CRITICAL REQUIREMENT 3)
         ========================================================================= */}

      {/* A. STRONG NETWORK → PASSKEY (FIDO2) */}
      {currentCondition === 'STRONG' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center">
            <KeyRound className="w-8 h-8 text-[#166534] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">{t.passkeyHeading}</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
              {t.passkeyPrompt}
            </p>
          </div>

          <button
            onClick={handlePasskeyAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.passkeyVerifying}</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{t.passkeyButton}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* B. WEAK NETWORK → TOTP (RFC 6238) */}
      {currentCondition === 'WEAK' && (
        <form onSubmit={handleTotpAuth} className="space-y-4">
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-950">
            <span className="font-bold block mb-0.5">{t.totpHeading}</span>
            <p className="opacity-90 leading-relaxed">{t.totpPrompt}</p>
          </div>

          <div>
            <label htmlFor="auth-totp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.totpLabel}
            </label>
            <input
              id="auth-totp"
              type="text"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full tracking-widest text-center font-mono text-lg py-2.5 px-4 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#166534]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || totpCode.length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.totpVerifying}</span>
              </>
            ) : (
              <span>{t.totpButton}</span>
            )}
          </button>
        </form>
      )}

      {/* C. OFFLINE → TRUSTED DEVICE PIN */}
      {currentCondition === 'OFFLINE' && (
        <div className="space-y-4">
          {storedLease ? (
            <form onSubmit={handleOfflinePinAuth} className="space-y-4">
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-950">
                <span className="font-bold block mb-0.5">{t.offlinePinHeading}</span>
                <p className="opacity-90 leading-relaxed">{t.offlinePinPrompt}</p>
              </div>

              <div>
                <label htmlFor="auth-pin" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.offlinePinLabel}
                </label>
                <input
                  id="auth-pin"
                  type="password"
                  maxLength={8}
                  inputMode="numeric"
                  value={offlinePin}
                  onChange={(e) => setOfflinePin(e.target.value)}
                  placeholder="••••"
                  className="w-full tracking-widest text-center font-mono text-lg py-2.5 px-4 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#166534]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || offlinePin.length < 4}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.offlinePinVerifying}</span>
                  </>
                ) : (
                  <>
                    <HardDriveDownload className="w-4 h-4" />
                    <span>{t.offlinePinButton}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2">
              <span className="font-bold block text-sm">{t.offlinePinHeading}</span>
              <p className="leading-relaxed">
                {t.offlinePinUnprovisioned}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenEnrollment}
                  className="px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-900 font-semibold transition-colors cursor-pointer"
                >
                  {isTamil ? 'சாதனத்தை அமைக்கவும்' : 'Open Provisioning Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permitted Password Option for Admin / Fallback (Empty, clean input) */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <details className="text-xs text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-800 transition-colors">
            {t.passwordLabel}
          </summary>
          <form onSubmit={handlePasswordAuth} className="mt-3 space-y-3">
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pr-10 pl-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#166534]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || currentCondition === 'OFFLINE'}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t.signIn}
            </button>
          </form>
        </details>
      </div>

      {/* Link to Register New Member (Admin Approval Required) */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2.5 text-center">
        <button
          type="button"
          onClick={() => setViewMode('REGISTER')}
          className="inline-flex items-center gap-1.5 text-xs text-[#166534] hover:text-[#14532d] font-bold cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t.noAccountYet}</span>
        </button>

        <p className="text-[11px] text-slate-400 italic">
          {t.noManualSwitchNotice}
        </p>

        <button
          type="button"
          onClick={onOpenRecovery}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
        >
          {t.forgotPassword}
        </button>
      </div>
    </div>
  );
};
