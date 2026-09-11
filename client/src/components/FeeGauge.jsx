import React from 'react';
import { Gauge, Zap, ShieldCheck, Rocket, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export default function FeeGauge({ feeData, livePulse }) {
  if (!feeData) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse flex items-center justify-center min-h-[220px]">
        <div className="text-slate-500 text-sm flex items-center gap-2">
          <Gauge className="w-5 h-5 animate-spin" /> Fetching live gas oracle data...
        </div>
      </div>
    );
  }

  const { safeGwei, proposeGwei, fastGwei, percentile = 50, label = 'normal' } = feeData;

  // Determine color scheme based on fee label
  const getLabelConfig = (l) => {
    switch (l) {
      case 'low':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          glow: 'shadow-emerald-500/10',
          barColor: 'from-emerald-500 to-teal-400',
          icon: ArrowDownRight,
          tag: 'CHEAP / OPTIMAL',
        };
      case 'high':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          glow: 'shadow-rose-500/10',
          barColor: 'from-amber-500 to-rose-500',
          icon: ArrowUpRight,
          tag: 'HIGH / BUSY',
        };
      default:
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          glow: 'shadow-amber-500/10',
          barColor: 'from-blue-500 to-amber-400',
          icon: Minus,
          tag: 'AVERAGE / NORMAL',
        };
    }
  };

  const config = getLabelConfig(label);
  const LabelIcon = config.icon;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Live pulse flash effect */}
      {livePulse && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse"></div>
      )}

      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Gauge className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Live Fee Speedometer</h3>
            <p className="text-xs text-slate-400">Current Ethereum Gas Prices (Gwei)</p>
          </div>
        </div>

        {/* Dynamic Percentile Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text} border ${config.border} shadow-lg ${config.glow}`}
        >
          <LabelIcon className="w-4 h-4" />
          <span className="uppercase tracking-wider">{label}</span>
          <span className="text-[10px] opacity-75 font-normal">({percentile}% 24h percentile)</span>
        </div>
      </div>

      {/* Main Gauge & Speed Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Safe / Slow */}
        <div className="bg-[#0b0f19]/90 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between group hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safe / Slow</span>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {safeGwei} <span className="text-xs font-normal text-slate-400">Gwei</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ~3 mins
          </span>
        </div>

        {/* Propose / Standard (Highlighted) */}
        <div className="bg-gradient-to-br from-[#131d35] to-[#0f172a] border border-blue-500/30 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <Zap className="w-4 h-4 text-blue-400 fill-blue-400/20" />
              <span>Propose / Standard</span>
            </div>
            <div className="text-3xl font-black text-white mt-1 tracking-tight">
              {proposeGwei} <span className="text-xs font-normal text-slate-400">Gwei</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            ~45 secs
          </span>
        </div>

        {/* Fast / Rapid */}
        <div className="bg-[#0b0f19]/90 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between group hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Rocket className="w-4 h-4 text-purple-400" />
              <span>Fast / Rapid</span>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {fastGwei} <span className="text-xs font-normal text-slate-400">Gwei</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            ~15 secs
          </span>
        </div>
      </div>

      {/* Percentile Progress Bar Meter */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>24h Fee Percentile Index</span>
          <span className="text-white font-semibold">{percentile}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${config.barColor} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(100, Math.max(5, percentile))}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>0% (Historical Min)</span>
          <span>50% (Median)</span>
          <span>100% (Historical Max)</span>
        </div>
      </div>
    </div>
  );
}
