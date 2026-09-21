import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GitCompareArrows, RefreshCw, Crown, TrendingDown, TrendingUp, Minus } from 'lucide-react';

const CHAIN_META = {
  ethereum: { name: 'Ethereum', color: 'bg-blue-500', symbol: 'ETH', icon: '⟠' },
  polygon:  { name: 'Polygon',  color: 'bg-purple-500', symbol: 'MATIC', icon: '⬡' },
  arbitrum: { name: 'Arbitrum', color: 'bg-sky-500', symbol: 'ETH', icon: '🔷' },
  base:     { name: 'Base',     color: 'bg-blue-600', symbol: 'ETH', icon: '🔵' },
};

const ETH_PRICE_USD = 3200; // Approximate; same assumption as TxCostCalculator
const SWAP_GAS_LIMIT = 150000; // Uniswap swap gas limit

export default function ChainCompare({ chainFees = [], onRefresh }) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setLoading(true);
      await onRefresh();
      setLoading(false);
    }
  };

  // Find cheapest chain
  const cheapestChain = chainFees.length > 0
    ? chainFees.reduce((min, c) => {
        const minCost = (min.proposeGwei * SWAP_GAS_LIMIT) / 1e9;
        const cCost = (c.proposeGwei * SWAP_GAS_LIMIT) / 1e9;
        return cCost < minCost ? c : min;
      })
    : null;

  const getSwapCostUsd = (proposeGwei) => {
    const ethCost = (SWAP_GAS_LIMIT * proposeGwei) / 1e9;
    return (ethCost * ETH_PRICE_USD).toFixed(2);
  };

  const getLabelStyle = (label) => {
    if (label === 'low') return {
      text: 'Cheap',
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: TrendingDown,
    };
    if (label === 'high') return {
      text: 'Expensive',
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: TrendingUp,
    };
    return {
      text: 'Normal',
      bg: 'bg-zinc-200/60 text-zinc-600 dark:text-zinc-400 dark:bg-zinc-800 border-zinc-300/40 dark:border-zinc-700',
      icon: Minus,
    };
  };

  return (
    <div className="shadcn-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 dotted-divider">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center shrink-0">
            <GitCompareArrows className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              Multi-Chain Gas Comparison
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live gas prices across EVM chains • Swap cost = 150K gas
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Chain Rows */}
      {loading && chainFees.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-xs text-zinc-500">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading chain data...
        </div>
      ) : chainFees.length === 0 ? (
        <div className="text-center py-6 text-xs text-zinc-500 dark:text-zinc-400">
          No chain data available yet. The server is still collecting readings.
        </div>
      ) : (
        <div className="space-y-2.5">
          {chainFees.map((c) => {
            const meta = CHAIN_META[c.chain] || { name: c.chain, color: 'bg-zinc-500', symbol: '?', icon: '●' };
            const isCheapest = cheapestChain && c.chain === cheapestChain.chain;
            const labelStyle = getLabelStyle(c.label);
            const LabelIcon = labelStyle.icon;
            const swapCost = getSwapCostUsd(c.proposeGwei);

            return (
              <div
                key={c.chain}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isCheapest
                    ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'shadcn-card-subtle'
                }`}
              >
                {/* Left: Chain Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg ${meta.color} flex items-center justify-center text-white text-base shrink-0`}>
                    {meta.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{meta.name}</span>
                      {isCheapest && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                          <Crown className="w-2.5 h-2.5" /> CHEAPEST
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-1 ${labelStyle.bg}`}>
                      <LabelIcon className="w-2.5 h-2.5" />
                      {labelStyle.text}
                    </span>
                  </div>
                </div>

                {/* Right: Gas Price + Swap Cost */}
                <div className="text-right shrink-0 pl-3">
                  <div className="text-lg font-extrabold text-zinc-900 dark:text-white">
                    {c.proposeGwei} <span className="text-xs font-semibold text-zinc-400">Gwei</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                    Swap ≈ ${swapCost}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 pt-1">
        <span>Prices update every 20 seconds via Socket.io</span>
      </div>
    </div>
  );
}
