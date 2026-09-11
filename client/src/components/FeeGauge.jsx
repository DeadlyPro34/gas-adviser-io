import React from 'react';
import { Gauge, Zap, ShieldCheck, Rocket, ArrowDownRight, ArrowUpRight, Minus, Activity } from 'lucide-react';

export default function FeeGauge({ feeData, livePulse }) {
  if (!feeData) {
    return (
      <div className="shadcn-card p-6 flex items-center justify-center min-h-[160px]">
        <div className="text-zinc-500 text-xs flex items-center gap-2">
          <Activity className="w-4 h-4 animate-spin text-zinc-400" />
          <span>Connecting to Ethereum Gas Oracle...</span>
        </div>
      </div>
    );
  }

  const { safeGwei, proposeGwei, fastGwei, percentile = 50, label = 'normal' } = feeData;

  const getLabelConfig = (l) => {
    switch (l) {
      case 'low':
        return {
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          barColor: 'bg-emerald-500',
          icon: ArrowDownRight,
          tag: 'CHEAP / OPTIMAL',
        };
      case 'high':
        return {
          badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          barColor: 'bg-rose-500',
          icon: ArrowUpRight,
          tag: 'HIGH CONGESTION',
        };
      default:
        return {
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          barColor: 'bg-amber-500',
          icon: Minus,
          tag: 'MODERATE / AVERAGE',
        };
    }
  };

  const config = getLabelConfig(label);
  const LabelIcon = config.icon;

  const formatDisplayGwei = (val) => {
    if (val == null) return '--';
    return typeof val === 'number' ? (val < 1 ? val.toFixed(3) : val.toFixed(1)) : val;
  };

  return (
    <div className="shadcn-card p-6 space-y-5 relative overflow-hidden">
      {/* Real-time pulse indicator line at top */}
      {livePulse && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 transition-all"></div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 dotted-divider">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Gas Speedometer & Tiers
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Live Ethereum mainnet gwei readings
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.badge}`}
        >
          <LabelIcon className="w-3.5 h-3.5" />
          <span>{config.tag}</span>
        </div>
      </div>

      {/* 3 Metric Cards (Matches the Total Assets metric cards in reference images) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Safe / Slow */}
        <div className="shadcn-card-subtle p-4 rounded-xl relative group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Safe Low</span>
            <div className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatDisplayGwei(safeGwei)} <span className="text-xs font-normal text-zinc-500">Gwei</span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Est. wait: ~3 mins</p>
        </div>

        {/* Propose / Standard */}
        <div className="shadcn-card-subtle p-4 rounded-xl border-blue-500/30 dark:border-blue-500/40 relative group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Market Standard</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatDisplayGwei(proposeGwei)} <span className="text-xs font-normal text-zinc-500">Gwei</span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Est. wait: ~45 secs</p>
        </div>

        {/* Fast / Rapid */}
        <div className="shadcn-card-subtle p-4 rounded-xl relative group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fast Priority</span>
            <div className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Rocket className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatDisplayGwei(fastGwei)} <span className="text-xs font-normal text-zinc-500">Gwei</span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Est. wait: ~15 secs</p>
        </div>
      </div>

      {/* Clean 24h Percentile Meter (Matches the Basic Plan 70% progress meter in sidebar) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-300 font-medium">
          <span>24-Hour Fee Percentile Rank</span>
          <span className="font-bold text-zinc-900 dark:text-white">{percentile}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/60">
          <div
            className={`h-full rounded-full ${config.barColor} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(5, percentile))}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
          <span>0% (Historical Low)</span>
          <span>50% (Median)</span>
          <span>100% (Historical Peak)</span>
        </div>
      </div>
    </div>
  );
}
