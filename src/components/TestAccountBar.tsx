import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Translations } from '../utils/translations';

interface TestAccountBarProps {
  onSelectEmail: (email: string) => void;
  onQuickLogin?: (email: string) => void;
  isLoggedIn: boolean;
  currentRole?: string;
  t: Translations;
  isTamil: boolean;
}

export const TestAccountBar: React.FC<TestAccountBarProps> = ({
  onSelectEmail,
  onQuickLogin,
  isLoggedIn,
  currentRole,
  t,
  isTamil,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const accounts = [
    {
      role: 'SUPER_ADMIN',
      badge: isTamil ? 'மாநில நிர்வாகி' : 'Super Admin',
      color: 'bg-purple-100 text-purple-900 border-purple-200',
      name: 'Sanjay N (State Coordinator)',
      email: 'sherasanjayn@gmail.com',
      desc: isTamil ? 'அனைத்து குழுக்கள் & நிதி வரிசை' : 'Full Org Governance & Allocation',
    },
    {
      role: 'GROUP_ADMIN',
      badge: isTamil ? 'குழு தலைவி 1' : 'Group Admin 1',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      name: 'Anitha Murugan',
      email: 'anitha.leader@magilirkulu.org',
      desc: isTamil ? 'செம்பருத்தி மகளிர் குழு (திருவாரூர்)' : 'Sembaruthi SHG (Thiruvarur)',
    },
    {
      role: 'GROUP_ADMIN',
      badge: isTamil ? 'குழு தலைவி 2' : 'Group Admin 2',
      color: 'bg-teal-100 text-teal-900 border-teal-200',
      name: 'Selvi Ramanathan',
      email: 'selvi.leader@magilirkulu.org',
      desc: isTamil ? 'முல்லை மகளிர் குழு (மதுரை)' : 'Mullai SHG (Madurai Rural)',
    },
    {
      role: 'MEMBER',
      badge: isTamil ? 'செயலில் உள்ள உறுப்பினர்' : 'Member (Active)',
      color: 'bg-blue-100 text-blue-900 border-blue-200',
      name: 'Kavitha Sundaram',
      email: 'kavitha.member@magilirkulu.org',
      desc: isTamil ? 'பாஸ்புக் & UPI செலுத்துதல்' : 'Passbook, UPI Submissions & Loans',
    },
    {
      role: 'MEMBER',
      badge: isTamil ? 'புதிய பதிவு' : 'Member (Pending)',
      color: 'bg-amber-100 text-amber-900 border-amber-200',
      name: 'Priya Vasanth',
      email: 'priya.new@magilirkulu.org',
      desc: isTamil ? 'ஒப்புதல் பரிசீலனை நிலை' : 'Pending Super Admin Review',
    },
  ];

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isTamil ? 'சோதனை கணக்குகள்:' : 'Section 26 Test Roles:'}</span>
            </span>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 shrink-0">
              {accounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    if (onQuickLogin) {
                      onQuickLogin(acc.email);
                    } else {
                      onSelectEmail(acc.email);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={`${acc.name} — ${acc.desc}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{acc.badge}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            <span>{isExpanded ? (isTamil ? 'சுருக்கு' : 'Less') : (isTamil ? 'விவரம்' : 'Details')}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Panel with Details & 1-Click Login */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3 pb-1 border-t border-slate-800 mt-2 animate-in fade-in duration-150">
            {accounts.map((acc) => (
              <div
                key={acc.email}
                className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 flex flex-col justify-between space-y-2 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${acc.color}`}>
                      {acc.badge}
                    </span>
                  </div>
                  <span className="font-bold text-slate-100 block text-xs">{acc.name}</span>
                  <span className="font-mono text-[10px] text-slate-400 block truncate" title={acc.email}>
                    {acc.email}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">{acc.desc}</span>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectEmail(acc.email)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-bold text-slate-200 text-center cursor-pointer"
                  >
                    {isTamil ? 'மின்னஞ்சல்' : 'Fill'}
                  </button>
                  {onQuickLogin && (
                    <button
                      type="button"
                      onClick={() => onQuickLogin(acc.email)}
                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white text-center cursor-pointer shadow-2xs"
                    >
                      {isTamil ? 'உள்நுழை' : '1-Click Login'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
