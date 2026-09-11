import React from 'react';
import { Sparkles, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Recommendation({ feeData }) {
  if (!feeData) return null;

  const { percentile = 50, label = 'normal', proposeGwei } = feeData;

  const getAdvice = () => {
    if (label === 'low') {
      return {
        title: 'Optimal Window to Transact',
        summary: `Gas prices (${proposeGwei} Gwei) are in the lower ${percentile}% of today's price distribution.`,
        details: 'Network activity is quiet. Perfect opportunity for DEX swaps, NFT mints, or complex smart contract interactions.',
        statusColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        icon: CheckCircle2,
        action: 'Recommended: Transact Now',
        dropEstimate: 'Current fees are near 24h floor.',
      };
    } else if (label === 'high') {
      return {
        title: 'Fees are Elevated — Delay Non-Urgent Calls',
        summary: `Gas prices (${proposeGwei} Gwei) are currently higher than ${percentile}% of readings in the past 24 hours.`,
        details: 'High network demand detected. If your transaction is not time-sensitive, waiting 30–60 minutes could save up to 40% in gas fees.',
        statusColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
        icon: AlertTriangle,
        action: 'Recommended: Wait for Dip',
        dropEstimate: 'Likely to cool down within 45–90 mins.',
      };
    } else {
      return {
        title: 'Moderate Gas Price Conditions',
        summary: `Gas prices (${proposeGwei} Gwei) are near the 24-hour median (${percentile}th percentile).`,
        details: 'Fees are fair for standard token transfers and approvals. For large multi-step transactions, monitoring for a dip is advised.',
        statusColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
        icon: Clock,
        action: 'Recommended: Standard Flow',
        dropEstimate: 'Fluctuating within typical range.',
      };
    }
  };

  const advice = getAdvice();
  const AdviceIcon = advice.icon;

  return (
    <div className="shadcn-card p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 dotted-divider">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Smart Timing Advisor
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Algorithmic execution recommendation
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${advice.badgeBg} self-start sm:self-auto`}
        >
          <AdviceIcon className="w-3.5 h-3.5" />
          {advice.action}
        </span>
      </div>

      {/* Advisory Body */}
      <div className="shadcn-card-subtle p-4 rounded-xl space-y-2">
        <h4 className={`text-sm font-bold ${advice.statusColor} flex items-center gap-1.5`}>
          {advice.title}
        </h4>
        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{advice.summary}</p>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {advice.details}
        </p>
      </div>

      {/* Bottom Timing Note */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>{advice.dropEstimate}</span>
        </div>
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
          Predictive cycle active <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
