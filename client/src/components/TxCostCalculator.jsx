import React, { useState } from 'react';
import { DollarSign, ArrowRightLeft, Send, Repeat, Image, Layers } from 'lucide-react';

const TX_TYPES = [
  { id: 'transfer', name: 'ETH Transfer', gasLimit: 21000, icon: Send },
  { id: 'erc20', name: 'ERC-20 Transfer', gasLimit: 65000, icon: Layers },
  { id: 'swap', name: 'Uniswap v3 Swap', gasLimit: 150000, icon: Repeat },
  { id: 'nft', name: 'NFT Minting', gasLimit: 180000, icon: Image },
];

export default function TxCostCalculator({ proposeGwei = 20 }) {
  const [ethPriceUsd, setEthPriceUsd] = useState(3200); // Default market ETH price

  // Formula: USD = (GasLimit * Gwei * 1e-9) * EthPrice
  const calculateCost = (gasLimit) => {
    const ethCost = (gasLimit * proposeGwei) / 1e9;
    const usdCost = ethCost * ethPriceUsd;
    return {
      eth: ethCost.toFixed(5),
      usd: usdCost.toFixed(2),
    };
  };

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">USD Transaction Cost Calculator</h3>
            <p className="text-xs text-slate-400">Estimated cost per action at current {proposeGwei} Gwei</p>
          </div>
        </div>

        {/* Editable ETH Price Tag */}
        <div className="flex items-center gap-2 bg-[#0b0f19] px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">1 ETH =</span>
          <span className="text-emerald-400 font-bold">$</span>
          <input
            type="number"
            value={ethPriceUsd}
            onChange={(e) => setEthPriceUsd(Math.max(1, parseFloat(e.target.value) || 0))}
            className="w-16 bg-transparent text-white font-bold focus:outline-none text-xs"
          />
          <span className="text-slate-500">USD</span>
        </div>
      </div>

      {/* Grid of Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TX_TYPES.map((tx) => {
          const Icon = tx.icon;
          const cost = calculateCost(tx.gasLimit);
          return (
            <div
              key={tx.id}
              className="bg-[#0b0f19]/80 border border-slate-800/80 hover:border-blue-500/40 rounded-xl p-4 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{tx.gasLimit.toLocaleString()} gas</span>
              </div>

              <h4 className="text-xs font-semibold text-slate-300">{tx.name}</h4>
              <div className="text-xl font-extrabold text-white mt-1">
                ${cost.usd} <span className="text-xs text-slate-400 font-normal">USD</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">{cost.eth} ETH</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
