import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LogOut,
  KeyRound,
  Smartphone,
  HardDriveDownload,
  Lock,
  History,
  RefreshCw,
} from 'lucide-react';
import { AuthMethod } from './LoginCard';
import { NetworkCondition } from './NetworkBar';
import { Translations } from '../utils/translations';

interface SessionViewProps {
  user: { id: string; email: string; role: 'ADMIN' | 'USER' };
  authMethod: AuthMethod;
  isOffline: boolean;
  networkCondition: NetworkCondition;
  csrfToken?: string;
  onLogout: () => void;
  t: Translations;
  isTamil: boolean;
}

export const SessionView: React.FC<SessionViewProps> = ({
  user,
  authMethod,
  isOffline,
  networkCondition,
  csrfToken,
  onLogout,
  t,
  isTamil,
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [isOffline]);

  const fetchEvents = async () => {
    if (isOffline) return;
    setIsLoadingEvents(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {
      // offline
    } finally {
      setIsLoadingEvents(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#166534] flex items-center justify-center font-bold text-lg">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user.email}</h2>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-900' : 'bg-slate-100 text-slate-700'
              }`}>
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              User ID: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.signOut}</span>
        </button>
      </div>

      {/* Verification Details Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="block text-slate-400 font-medium uppercase tracking-wider mb-1 text-[11px]">
            {isTamil ? 'அங்கீகார முறை' : 'Authentication Method'}
          </span>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            {authMethod === 'PASSKEY' && <KeyRound className="w-4 h-4 text-emerald-600" />}
            {authMethod === 'TOTP' && <Smartphone className="w-4 h-4 text-amber-600" />}
            {authMethod === 'OFFLINE_PIN' && <HardDriveDownload className="w-4 h-4 text-blue-600" />}
            {authMethod === 'PASSWORD' && <Lock className="w-4 h-4 text-slate-600" />}
            <span>
              {authMethod === 'PASSKEY' && (isTamil ? 'Passkey (FIDO2)' : 'WebAuthn Passkey')}
              {authMethod === 'TOTP' && (isTamil ? 'TOTP (RFC 6238)' : 'RFC 6238 TOTP')}
              {authMethod === 'OFFLINE_PIN' && (isTamil ? 'சாதன PIN' : 'Trusted Device PIN')}
              {authMethod === 'PASSWORD' && (isTamil ? 'கடவுச்சொல்' : 'Argon2 Password')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="block text-slate-400 font-medium uppercase tracking-wider mb-1 text-[11px]">
            {isTamil ? 'அமர்வு பாதுகாப்பு நிலை' : 'Session Security Status'}
          </span>
          <div className="flex items-center gap-2 font-bold text-sm">
            {isOffline ? (
              <span className="text-blue-700">{t.locallyVerifiedTag}</span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t.serverVerifiedTag}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="block text-slate-400 font-medium uppercase tracking-wider mb-1 text-[11px]">
            {isTamil ? 'நெட்வொர்க் நிலை' : 'Network Condition'}
          </span>
          <div className="font-bold text-sm text-slate-800">
            {networkCondition === 'STRONG' && t.networkBadgeStrong}
            {networkCondition === 'WEAK' && t.networkBadgeWeak}
            {networkCondition === 'OFFLINE' && t.networkBadgeOffline}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {t.auditTrailTitle}
            </h3>
          </div>
          <button
            onClick={fetchEvents}
            disabled={isLoadingEvents || isOffline}
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
            <span>{isTamil ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
        </div>

        {isOffline ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs leading-relaxed">
            <strong>{isTamil ? 'இணையமில்லா நிலை:' : 'Offline Operation Mode:'}</strong>{' '}
            {isTamil
              ? 'நேரடி சேவையக தணிக்கை பதிவுகளை அணுக இணையம் தேவை. சாதனத்தில் சரிபார்க்கப்பட்ட நிகழ்வுகள் உள்ளூரில் பத்திரமாக வைக்கப்பட்டு இணையம் கிடைத்தவுடன் ஒத்திசைக்கப்படும்.'
              : 'Live audit log queries require backend connectivity. Signed offline authentication events are safely queued and will synchronize when online.'}
          </div>
        ) : events.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">
            {isTamil ? 'பதிவுகள் எதுவும் இல்லை.' : 'No audit records found yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">{t.colTimestamp}</th>
                  <th className="py-2.5 px-3">{t.colMethod}</th>
                  <th className="py-2.5 px-3">{t.colNetwork}</th>
                  <th className="py-2.5 px-3">{t.colResult}</th>
                  <th className="py-2.5 px-3">{t.colAccount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <tr key={ev._id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {ev.method}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {ev.network_state}
                    </td>
                    <td className="py-2 px-3">
                      {ev.success ? (
                        <span className="text-emerald-700 font-semibold">
                          {isTamil ? 'வெற்றி' : 'Success'}
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          {ev.failure_reason || (isTamil ? 'தோல்வி' : 'Failed')}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {ev.email || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
