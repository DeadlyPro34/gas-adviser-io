import React, { useState } from 'react';
import { DollarSign, Send, Repeat, Image, Layers } from 'lucide-react';

const TX_TYPES = [
  { id: 'transfer', name: 'ETH Transfer', gasLimit: 21000, icon: Send },
  { id: 'erc20', name: 'ERC-20 Transfer', gasLimit: 65000, icon: Layers },
  { id: 'swap', name: 'Uniswap Swap', gasLimit: 150000, icon: Repeat },
  { id: 'nft', name: 'NFT Mint', gasLimit: 180000, icon: Image },
];

export default function TxCostCalculator({ proposeGwei = 20 }) {
  const [ethPriceUsd, setEthPriceUsd] = useState(3200);

  const calculateCost = (gasLimit) => {
    const ethCost = (gasLimit * proposeGwei) / 1e9;
    const usdCost = ethCost * ethPriceUsd;
    return {
      eth: ethCost.toFixed(5),
      usd: usdCost.toFixed(2),
    };
  };

  return (
    <div className="shadcn-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 dotted-divider">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              USD Transaction Cost Calculator
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Estimated fee at current {proposeGwei} Gwei
            </p>
          </div>
        </div>

        {/* Editable ETH Price Tag */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-850 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs self-start sm:self-auto">
          <span className="text-zinc-500 dark:text-zinc-400">1 ETH =</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">$</span>
          <input
            type="number"
            value={ethPriceUsd}
            onChange={(e) => setEthPriceUsd(Math.max(1, parseFloat(e.target.value) || 0))}
            className="w-14 bg-transparent text-zinc-900 dark:text-white font-bold focus:outline-none text-xs"
          />
          <span className="text-zinc-400 font-medium">USD</span>
        </div>
      </div>

      {/* Grid of Actions (4 columns matching reference image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TX_TYPES.map((tx) => {
          const Icon = tx.icon;
          const cost = calculateCost(tx.gasLimit);
          return (
            <div
              key={tx.id}
              className="shadcn-card-subtle p-3.5 rounded-xl transition-all duration-200 hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-7 h-7 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {tx.gasLimit.toLocaleString()} gas
                </span>
              </div>

              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{tx.name}</h4>
              <div className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                ${cost.usd} <span className="text-[10px] text-zinc-400 font-normal">USD</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{cost.eth} ETH</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
