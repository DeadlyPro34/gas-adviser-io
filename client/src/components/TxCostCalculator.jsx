import React, { useState } from 'react';
import { DollarSign, Send, Repeat, Image, Layers, ChevronDown } from 'lucide-react';

const TX_TYPES = [
  { id: 'transfer', name: 'ETH Transfer', gasLimit: 21000, icon: Send },
  { id: 'erc20', name: 'ERC-20 Transfer', gasLimit: 65000, icon: Layers },
  { id: 'swap', name: 'Uniswap Swap', gasLimit: 150000, icon: Repeat },
  { id: 'nft', name: 'NFT Mint', gasLimit: 180000, icon: Image },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'INR', symbol: '₹' },
];

export default function TxCostCalculator({ proposeGwei = 20 }) {
  const [ethPrice, setEthPrice] = useState(3200);
  const [currency, setCurrency] = useState(CURRENCIES[0]);

  const formatFiat = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
    if (val < 0.01) return val.toFixed(6);
    return val.toFixed(2);
  };

  const calculateCost = (gasLimit) => {
    const ethCost = (gasLimit * proposeGwei) / 1e9;
    const fiatCost = ethCost * ethPrice;

    return {
      eth: ethCost.toFixed(5),
      fiat: formatFiat(fiatCost),
    };
  };

  return (
    <div className="shadcn-card p-6 space-y-5">
      {/* Header */}
      <div className="space-y-4 pb-4 dotted-divider">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Fiat Transaction Cost Calculator
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Estimated fee at current <span className="font-semibold text-zinc-700 dark:text-zinc-300">{proposeGwei} Gwei</span>
            </p>
          </div>
        </div>

        {/* Editable ETH Price & Currency Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex-1">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">1 ETH</span>
            <span className="text-zinc-300 dark:text-zinc-600">=</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{currency.symbol}</span>
            <input
              type="number"
              value={ethPrice}
              onChange={(e) => setEthPrice(Math.max(1, parseFloat(e.target.value) || 0))}
              className="flex-1 min-w-[80px] w-full max-w-[160px] bg-transparent text-zinc-900 dark:text-white font-bold focus:outline-none text-sm [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm text-zinc-400 dark:text-zinc-500 font-semibold shrink-0">{currency.code}</span>
          </div>

          <div className="relative shrink-0">
            <select
              value={currency.code}
              onChange={(e) => setCurrency(CURRENCIES.find(c => c.code === e.target.value))}
              className="appearance-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 pr-8 text-sm font-bold focus:outline-none cursor-pointer"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid of Actions */}
      <div className="grid grid-cols-2 gap-[12px]">
        {TX_TYPES.map((tx) => {
          const Icon = tx.icon;
          const cost = calculateCost(tx.gasLimit);
          return (
            <div
              key={tx.id}
              className="shadcn-card-subtle p-4 rounded-xl transition-all duration-200 hover:border-zinc-400 dark:hover:border-zinc-600 flex flex-col"
            >
              <div className="flex flex-col mb-4 gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-sm shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="inline-flex text-[11px] font-semibold px-2 py-1 rounded-md bg-zinc-200/60 dark:bg-zinc-800/80 text-[#888] dark:text-zinc-400 font-mono border border-zinc-300/40 dark:border-zinc-700/50 w-fit shrink-0 whitespace-nowrap">
                  {tx.gasLimit.toLocaleString('en-US')} gas
                </div>
              </div>

              <div className="mt-auto">
                <h4 className="text-[14px] font-semibold text-[#111] dark:text-zinc-200 whitespace-nowrap overflow-visible mb-1">
                  {tx.name}
                </h4>
                <div className="text-[18px] font-bold text-[#111] dark:text-white whitespace-nowrap overflow-visible">
                  {currency.symbol}{cost.fiat}{' '}
                  <span className="text-[11px] font-semibold text-[#888] dark:text-zinc-400 tracking-normal font-normal">
                    {currency.code}
                  </span>
                </div>
                <p className="text-[11px] text-[#aaa] dark:text-zinc-500 font-mono mt-1 whitespace-nowrap overflow-visible">
                  {cost.eth} ETH
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
