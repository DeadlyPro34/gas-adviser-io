import React from 'react';
import { Sparkles, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Recommendation({ feeData }) {
  if (!feeData) return null;

  const { percentile = 50, label = 'normal', proposeGwei } = feeData;

  const getAdvice = () => {
    if (label === 'low') {
      return {
        title: 'Great Time to Transact!',
        summary: `Gas prices (${proposeGwei} Gwei) are in the lower ${percentile}% of today's price distribution.`,
        details: 'Network activity is quiet. Perfect opportunity for DEX swaps, NFT mints, or complex smart contract interactions.',
        statusColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        icon: CheckCircle2,
        action: 'Recommended: Execute Immediately',
        dropEstimate: 'Current fees are near optimal levels.',
      };
    } else if (label === 'high') {
      return {
        title: 'Fees are Elevated — Consider Waiting',
        summary: `Gas prices (${proposeGwei} Gwei) are currently higher than ${percentile}% of readings in the past 24 hours.`,
        details: 'High network demand detected. If your transaction is not time-sensitive, waiting 30–60 minutes could save you 30–50% in network fees.',
        statusColor: 'text-rose-400',
        badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        icon: AlertTriangle,
        action: 'Recommended: Delay Non-Essential Swaps',
        dropEstimate: 'Likely to cool down within 45–90 minutes based on daily cycle.',
      };
    } else {
      return {
        title: 'Moderate Gas Prices',
        summary: `Gas prices (${proposeGwei} Gwei) are near the 24-hour median (${percentile}th percentile).`,
        details: 'Fees are fair for standard operations. If performing large volume or multi-step transactions, monitoring for a low dip is advised.',
        statusColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        icon: Clock,
        action: 'Recommended: Proceed if Needed',
        dropEstimate: 'Fees fluctuating within standard range.',
      };
    }
  };

  const advice = getAdvice();
  const AdviceIcon = advice.icon;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Smart Transaction Advisor</h3>
              <p className="text-xs text-slate-400">Algorithmic timing recommendation</p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${advice.badgeBg}`}>
            <AdviceIcon className="w-4 h-4" />
            {advice.action}
          </span>
        </div>

        {/* Advice Content Box */}
        <div className="bg-[#0b0f19]/80 border border-slate-800/80 rounded-xl p-5 space-y-3">
          <h4 className={`text-lg font-bold ${advice.statusColor} flex items-center gap-2`}>
            {advice.title}
          </h4>
          <p className="text-sm font-medium text-slate-200">{advice.summary}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{advice.details}</p>
        </div>

        {/* Timing forecast bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 rounded-xl px-4 py-2.5 border border-slate-800/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{advice.dropEstimate}</span>
          </div>
          <span className="text-blue-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
            View Fee History <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
