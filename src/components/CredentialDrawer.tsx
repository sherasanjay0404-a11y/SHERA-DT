import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Smartphone,
  HardDriveDownload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Shield,
  Loader2,
  Trash2,
} from 'lucide-react';
import { registerPasskey } from '../utils/webauthn';
import { hashPinLocal, saveDeviceLease, getStoredDeviceLease, clearDeviceLease } from '../utils/offlineAuth';
import { Translations } from '../utils/translations';

interface CredentialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail: string;
  onSelectEmail: (email: string) => void;
  t: Translations;
  isTamil: boolean;
  csrfToken?: string;
}

export const CredentialDrawer: React.FC<CredentialDrawerProps> = ({
  isOpen,
  onClose,
  defaultEmail,
  onSelectEmail,
  t,
  isTamil,
  csrfToken,
}) => {
  const [activeTab, setActiveTab] = useState<'passkey' | 'totp' | 'pin'>('passkey');
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // TOTP State
  const [totpData, setTotpData] = useState<{
    secret: string;
    current_code: string;
    step_remaining: number;
    otpauth: string;
  } | null>(null);

  // Offline PIN State
  const [pin, setPin] = useState('1234');
  const [deviceName, setDeviceName] = useState('Magilir Kulu Field Tablet');
  const [storedLease, setStoredLease] = useState(getStoredDeviceLease());

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    setStoredLease(getStoredDeviceLease());
  }, [isOpen]);

  // Periodic TOTP countdown timer
  useEffect(() => {
    if (!isOpen || activeTab !== 'totp') return;
    loadTotpSetup();
    const interval = setInterval(() => {
      loadTotpSetup();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, email]);

  const loadTotpSetup = async () => {
    try {
      const res = await fetch('/api/totp/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTotpData(data);
      }
    } catch {
      // Ignored in offline
    }
  };

  const handleRegisterPasskey = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const optRes = await fetch('/api/webauthn/register/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!optRes.ok) throw new Error(isTamil ? 'பதிவு சவால் பெற முடியவில்லை.' : 'Failed to retrieve challenge.');
      const options = await optRes.json();

      const credential = await registerPasskey(options);

      const verifyRes = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          challenge_key: options.challenge_key,
          credential,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message || (isTamil ? 'Passkey பதிவு தோல்வி.' : 'Passkey registration failed.'));

      setStatusMsg({
        type: 'success',
        text: isTamil ? 'Passkey வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!' : 'Passkey enrolled successfully!',
      });
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setStatusMsg({ type: 'error', text: isTamil ? 'Passkey பதிவு ரத்து செய்யப்பட்டது.' : 'Passkey enrollment was cancelled.' });
      } else {
        setStatusMsg({ type: 'error', text: err.message || (isTamil ? 'Passkey அமைப்பதில் பிழை.' : 'Passkey setup failed.') });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProvisionDevice = async () => {
    if (!pin || pin.length < 4) {
      setStatusMsg({ type: 'error', text: isTamil ? 'PIN குறைந்தது 4 இலக்கங்களாக இருக்க வேண்டும்.' : 'PIN must be at least 4 digits.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/offline/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          pin,
          device_name: deviceName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to provision device.');

      const salt = 'salt_' + Math.random().toString(36).substring(2);
      const pinHash = await hashPinLocal(pin, salt);

      const lease = {
        deviceId: data.device_id,
        userId: data.offline_payload.user_id,
        email: data.offline_payload.email,
        role: data.offline_payload.role,
        pinHash,
        pinSalt: salt,
        leaseExpires: data.lease_expires,
        token: data.offline_payload.token,
        deviceName: deviceName,
      };

      saveDeviceLease(lease);
      setStoredLease(lease);
      setStatusMsg({
        type: 'success',
        text: isTamil
          ? `சாதனம் "${deviceName}" வெற்றிகரமாக அமைக்கப்பட்டது (7-நாள் இணையமில்லா அணுகல்).`
          : `Device "${deviceName}" provisioned for 7-day offline access.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Device provisioning failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLease = () => {
    clearDeviceLease();
    setStoredLease(null);
    setStatusMsg({ type: 'success', text: isTamil ? 'சாதன அணுகல் நீக்கப்பட்டது.' : 'Local device lease cleared.' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#166534]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isTamil ? 'சான்றுகள் & சாதன அமைப்பு' : 'Credential & Device Setup'}
              </h2>
              <p className="text-xs text-slate-500">
                {isTamil ? 'Passkeys, TOTP மற்றும் சாதன PIN அமைவு' : 'Configure Passkeys, TOTP, and Offline Leases'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close setup drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Target Account Selector */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isTamil ? 'இலக்கு மின்னஞ்சல்' : 'Target Account Email'}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-900 bg-white"
              />
              <button
                onClick={() => {
                  setEmail('sherasanjayn@gmail.com');
                  onSelectEmail('sherasanjayn@gmail.com');
                }}
                className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-100 cursor-pointer"
              >
                {isTamil ? 'நிர்வாகி மின்னஞ்சல்' : 'Admin Email'}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{statusMsg.text}</span>
            </div>
          )}

          {/* Method Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setActiveTab('passkey'); setStatusMsg(null); }}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'passkey'
                  ? 'border-[#166534] text-[#166534]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              1. Passkey
            </button>
            <button
              onClick={() => { setActiveTab('totp'); setStatusMsg(null); }}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'totp'
                  ? 'border-[#166534] text-[#166534]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              2. TOTP
            </button>
            <button
              onClick={() => { setActiveTab('pin'); setStatusMsg(null); }}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pin'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              3. Offline PIN
            </button>
          </div>

          {/* Tab 1: Passkey Enrollment */}
          {activeTab === 'passkey' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                {isTamil
                  ? 'உங்கள் சாதனத்தின் பயோமெட்ரிக் சென்சார், விண்டோஸ் ஹலோ அல்லது டச் ஐடி மூலம் உண்மையான FIDO2 WebAuthn Passkey-ஐ பதிவு செய்கிறது.'
                  : "Registers a real FIDO2 WebAuthn passkey using your device's biometric sensor, Windows Hello, or Touch ID."}
              </p>

              <button
                onClick={handleRegisterPasskey}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.passkeyVerifying}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{isTamil ? `${email}-க்கு Passkey பதிவு செய்` : `Enroll Passkey for ${email}`}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Tab 2: TOTP */}
          {activeTab === 'totp' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                {isTamil
                  ? 'RFC 6238 அங்கீகாரச் செயலி ரகசியம் மற்றும் நேரடி 6-இலக்கக் குறியீடு:'
                  : 'RFC 6238 authenticator secret and live 6-digit test code:'}
              </p>

              {totpData ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="block text-[11px] text-slate-500 font-medium uppercase mb-1">Base32 Secret</span>
                    <div className="flex items-center justify-between font-mono text-sm font-bold text-slate-900 bg-white p-2 rounded border border-slate-200">
                      <span>{totpData.secret}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(totpData.secret)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        title="Copy Secret"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] text-amber-800 font-semibold uppercase">
                        {isTamil ? 'செயலில் உள்ள குறியீடு' : 'Live Active Code'}
                      </span>
                      <span className="font-mono text-xl font-bold text-amber-950 tracking-wider">
                        {totpData.current_code}
                      </span>
                    </div>
                    <div className="text-right text-xs text-amber-800 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{totpData.step_remaining}s left</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-center py-4">Loading TOTP...</div>
              )}
            </div>
          )}

          {/* Tab 3: Offline PIN */}
          {activeTab === 'pin' && (
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                {isTamil
                  ? 'இந்தச் சாதனத்திற்கு 7-நாள் இணையமில்லா அணுகல் உரிமத்தை அமைக்கிறது.'
                  : 'Provisions a 7-day offline cryptographic access lease bound to this device.'}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {isTamil ? 'சாதனத்தின் பெயர்' : 'Device Name'}
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {isTamil ? 'உள்ளூர் PIN (4-8 இலக்கங்கள்)' : 'Local PIN (4-8 digits)'}
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-1.5 font-mono text-center tracking-widest rounded border border-slate-300 text-slate-900"
                  />
                </div>

                <button
                  onClick={handleProvisionDevice}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  <span>{isTamil ? '7-நாள் இணையமில்லா அணுகலை அமை' : 'Provision 7-Day Offline Lease'}</span>
                </button>
              </div>

              {storedLease && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {isTamil ? 'செயலில் உள்ள சாதன குத்தகை:' : 'Active Device Lease:'}
                    </span>
                    <button
                      onClick={handleClearLease}
                      className="text-red-600 hover:text-red-800 inline-flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{isTamil ? 'அணுகலை நீக்கு' : 'Revoke Lease'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 space-y-0.5">
                    <div>Device: {storedLease.deviceName}</div>
                    <div>Account: {storedLease.email}</div>
                    <div>Expires: {new Date(storedLease.leaseExpires).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>Magilir Kulu — RuralShield AI</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium cursor-pointer"
          >
            {isTamil ? 'முடிந்தது' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
