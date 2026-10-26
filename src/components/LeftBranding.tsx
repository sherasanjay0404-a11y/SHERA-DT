import React from 'react';
import { KeyRound, ShieldCheck, HardDriveDownload, Activity, Shield } from 'lucide-react';
import { NetworkCondition } from './NetworkBar';
import { Translations } from '../utils/translations';

interface LeftBrandingProps {
  currentCondition: NetworkCondition;
  t: Translations;
  isTamil: boolean;
}

export const LeftBranding: React.FC<LeftBrandingProps> = ({ currentCondition, t, isTamil }) => {
  return (
    <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-12 h-full">
      {/* Brand Title and Mission */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-[#166534] flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                {t.appName}
              </h1>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                {t.appSubname}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
              {isTamil ? 'தானியங்கி இணையநிலை அங்கீகாரக் கட்டமைப்பு' : 'Network-Aware Adaptive Authentication System'}
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-lg mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t.tagline}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.purposeDesc}
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-4 max-w-lg mb-8">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.benefit1Title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                {t.benefit1Desc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.benefit2Title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                {t.benefit2Desc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.benefit3Title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                {t.benefit3Desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic NAAA Decision Policy Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs max-w-lg">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {t.decisionMatrixTitle}
          </span>
          <span className="text-[11px] font-mono text-emerald-800 font-bold">
            {currentCondition}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div
            className={`p-2.5 rounded-lg transition-colors border ${
              currentCondition === 'STRONG'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{t.ruleStrong}</span>
              {currentCondition === 'STRONG' && (
                <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded font-bold uppercase">
                  Active
                </span>
              )}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg transition-colors border ${
              currentCondition === 'WEAK'
                ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{t.ruleWeak}</span>
              {currentCondition === 'WEAK' && (
                <span className="text-[10px] bg-amber-700 text-white px-2 py-0.5 rounded font-bold uppercase">
                  Active
                </span>
              )}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg transition-colors border ${
              currentCondition === 'OFFLINE'
                ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{t.ruleOffline}</span>
              {currentCondition === 'OFFLINE' && (
                <span className="text-[10px] bg-blue-700 text-white px-2 py-0.5 rounded font-bold uppercase">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2.5 leading-normal">
          {t.autoSelectedPolicyNotice}
        </p>
      </div>
    </div>
  );
};
