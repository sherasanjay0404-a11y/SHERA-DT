import React from 'react';
import { Wifi, WifiOff, RefreshCw, SlidersHorizontal, Signal, SignalLow, SignalZero } from 'lucide-react';
import { Translations } from '../utils/translations';

export type NetworkCondition = 'STRONG' | 'WEAK' | 'OFFLINE';
export type SimulationMode = 'REAL' | 'FORCE_STRONG' | 'FORCE_WEAK' | 'FORCE_OFFLINE';

interface NetworkBarProps {
  condition: NetworkCondition;
  latencyMs: number;
  simulationMode: SimulationMode;
  onSimulationChange: (mode: SimulationMode) => void;
  onRefreshProbe: () => void;
  isProbing: boolean;
  queuedSyncCount: number;
  onTriggerSync: () => void;
  isSyncing: boolean;
  t: Translations;
  isTamil: boolean;
}

export const NetworkBar: React.FC<NetworkBarProps> = ({
  condition,
  latencyMs,
  simulationMode,
  onSimulationChange,
  onRefreshProbe,
  isProbing,
  queuedSyncCount,
  onTriggerSync,
  isSyncing,
  t,
  isTamil,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left: Active Network Strength Meter & Policy Mode */}
        <div className="flex items-center gap-3">
          {/* Signal Strength Meter Bars */}
          <div className="flex items-center gap-2">
            {condition === 'STRONG' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-500/40 shadow-xs">
                {/* 4-bar visual signal icon */}
                <span className="flex items-end gap-0.5 h-3.5 mr-0.5">
                  <span className="w-1 h-1.5 bg-emerald-400 rounded-2xs"></span>
                  <span className="w-1 h-2.5 bg-emerald-400 rounded-2xs"></span>
                  <span className="w-1 h-3.5 bg-emerald-400 rounded-2xs"></span>
                  <span className="w-1 h-4 bg-emerald-400 rounded-2xs"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.networkBadgeStrong}</span>
              </span>
            )}
            {condition === 'WEAK' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-300 font-bold border border-amber-500/40 shadow-xs">
                {/* 2-bar visual signal icon */}
                <span className="flex items-end gap-0.5 h-3.5 mr-0.5">
                  <span className="w-1 h-1.5 bg-amber-400 rounded-2xs"></span>
                  <span className="w-1 h-2.5 bg-amber-400 rounded-2xs"></span>
                  <span className="w-1 h-3.5 bg-slate-700 rounded-2xs"></span>
                  <span className="w-1 h-4 bg-slate-700 rounded-2xs"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 text-amber-300" />
                <span>{t.networkBadgeWeak}</span>
              </span>
            )}
            {condition === 'OFFLINE' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/80 text-red-300 font-bold border border-red-500/40 shadow-xs">
                {/* 0-bar visual signal icon */}
                <span className="flex items-end gap-0.5 h-3.5 mr-0.5">
                  <span className="w-1 h-1.5 bg-red-500/50 rounded-2xs"></span>
                  <span className="w-1 h-2.5 bg-slate-800 rounded-2xs"></span>
                  <span className="w-1 h-3.5 bg-slate-800 rounded-2xs"></span>
                  <span className="w-1 h-4 bg-slate-800 rounded-2xs"></span>
                </span>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span>{t.networkBadgeOffline}</span>
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>
              Latency: <strong className="text-white">{condition === 'OFFLINE' ? 'Unreachable' : `${latencyMs}ms`}</strong>
            </span>
            <span>·</span>
            <span className="text-slate-300">
              {condition === 'STRONG' && (isTamil ? 'தானியங்கி முறை: Passkey (FIDO2)' : 'Auto-Selected: Passkey (FIDO2)')}
              {condition === 'WEAK' && (isTamil ? 'தானியங்கி முறை: TOTP குறியீடு' : 'Auto-Selected: TOTP (RFC 6238)')}
              {condition === 'OFFLINE' && (isTamil ? 'தானியங்கி முறை: சாதன PIN' : 'Auto-Selected: Trusted Device PIN')}
            </span>
          </div>

          <button
            onClick={onRefreshProbe}
            disabled={isProbing}
            title={t.checkingNetwork}
            className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Refresh network probe"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* Right: Simulation Controls & Sync Queue */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {queuedSyncCount > 0 && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing || condition === 'OFFLINE'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-semibold rounded text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isTamil ? `இணையமில்லா பதிவுகளை ஒத்திசை (${queuedSyncCount})` : `Sync Offline Events (${queuedSyncCount})`}
              </span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <span className="text-[11px] font-medium text-slate-400 px-1.5 hidden lg:inline">
              <SlidersHorizontal className="w-3 h-3 inline mr-1" />
              {t.simulateLabel}
            </span>
            <button
              onClick={() => onSimulationChange('REAL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                simulationMode === 'REAL'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.simAuto}
            </button>
            <button
              onClick={() => onSimulationChange('FORCE_STRONG')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                simulationMode === 'FORCE_STRONG'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.simStrong}
            </button>
            <button
              onClick={() => onSimulationChange('FORCE_WEAK')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                simulationMode === 'FORCE_WEAK'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.simWeak}
            </button>
            <button
              onClick={() => onSimulationChange('FORCE_OFFLINE')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                simulationMode === 'FORCE_OFFLINE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.simOffline}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
