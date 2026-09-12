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
      <div className="flex flex-col gap-3 pb-3 dotted-divider">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Gas Speedometer & Tiers
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Live Ethereum mainnet gwei readings
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border self-start ${config.badge}`}
        >
          <LabelIcon className="w-3.5 h-3.5" />
          <span>{config.tag}</span>
        </div>
      </div>

      {/* 3 Metric Cards — stacked vertically for clear readability in narrow panel */}
      <div className="space-y-3">
        {/* Safe / Slow */}
        <div className="shadcn-card-subtle p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white block leading-tight">Safe Low</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Est. wait: ~3 mins</span>
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {formatDisplayGwei(safeGwei)}
            </span>
            <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">Gwei</span>
          </div>
        </div>

        {/* Propose / Standard — highlighted */}
        <div className="shadcn-card-subtle p-4 rounded-xl border-blue-500/30 dark:border-blue-500/40 bg-blue-50/40 dark:bg-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 block leading-tight">Standard</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Est. wait: ~45 secs</span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20">
              Market
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {formatDisplayGwei(proposeGwei)}
            </span>
            <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">Gwei</span>
          </div>
        </div>

        {/* Fast / Rapid */}
        <div className="shadcn-card-subtle p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white block leading-tight">Fast Priority</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Est. wait: ~15 secs</span>
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {formatDisplayGwei(fastGwei)}
            </span>
            <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">Gwei</span>
          </div>
        </div>
      </div>

      {/* 24h Percentile Meter */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">24-Hour Fee Percentile Rank</span>
          <span className="text-base font-bold text-zinc-900 dark:text-white">{percentile}%</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/60">
          <div
            className={`h-full rounded-full ${config.barColor} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(5, percentile))}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <span>0% (Low)</span>
          <span>50% (Median)</span>
          <span>100% (Peak)</span>
        </div>
      </div>
    </div>
  );
}
