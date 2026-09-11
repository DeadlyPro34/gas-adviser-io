import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';

const TIMEFRAMES = [
  { label: '1H', hours: 1 },
  { label: '6H', hours: 6 },
  { label: '12H', hours: 12 },
  { label: '24H', hours: 24 },
];

export default function FeeChart({ historyData, onTimeframeChange, currentHours = 24, isDark = true }) {
  const [selectedHours, setSelectedHours] = useState(currentHours);

  const formattedData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    return historyData.map((item) => {
      const date = new Date(item.timestamp);
      return {
        ...item,
        timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTime: date.toLocaleString(),
      };
    });
  }, [historyData]);

  const latest = formattedData[formattedData.length - 1] || null;

  const handleSelectHours = (hours) => {
    setSelectedHours(hours);
    if (onTimeframeChange) {
      onTimeframeChange(hours);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="shadcn-card p-3 shadow-2xl text-xs space-y-1.5 min-w-[170px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f0f12]">
          <p className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-zinc-400" />
            {data.fullTime}
          </p>
          <div className="dotted-divider pt-1.5 space-y-1">
            <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
              <span>Fast (Priority):</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{data.fastGwei} Gwei</span>
            </div>
            <div className="flex justify-between items-center text-zinc-900 dark:text-white font-bold">
              <span>Propose (Market):</span>
              <span className="font-bold text-sky-500 dark:text-sky-400">{data.proposeGwei} Gwei</span>
            </div>
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span>Safe (Slow):</span>
              <span className="font-medium">{data.safeGwei} Gwei</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="shadcn-card p-6 space-y-5">
      {/* Top Header Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
          <span className="tracking-tight text-zinc-800 dark:text-zinc-300">Gas Fee Trends Overview</span>
        </div>

        {/* Segmented Timeframe Selector */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.hours}
              onClick={() => handleSelectHours(tf.hours)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                selectedHours === tf.hours
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-850'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric Stat */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2">
        <div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block">
            Market Propose Rate
          </span>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {latest ? `${latest.proposeGwei} Gwei` : '18.4 Gwei'}
            </span>
            {latest && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {latest.label ? `${latest.label.toUpperCase()} · ${latest.percentile || 50}th percentile` : 'Live'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 self-start sm:self-auto">
          <span>Range: Last {selectedHours} Hours</span>
        </div>
      </div>

      {/* Recharts Area/Line Chart matching reference image */}
      <div className="h-[270px] w-full pt-1">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
            No historical fee data available for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="proposeShadcn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#27272a' : '#e4e4e7'}
                vertical={false}
              />
              <XAxis
                dataKey="timeLabel"
                stroke={isDark ? '#71717a' : '#a1a1aa'}
                tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={isDark ? '#71717a' : '#a1a1aa'}
                tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                unit=" Gw"
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Dashed Secondary Line (Fast Gwei) */}
              <Area
                type="monotone"
                dataKey="fastGwei"
                stroke="#a1a1aa"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                name="Fast Gwei"
              />
              {/* Solid Primary Line (Propose Gwei) */}
              <Area
                type="monotone"
                dataKey="proposeGwei"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fill="url(#proposeShadcn)"
                name="Propose Gwei"
              />
              {/* Safe low line */}
              <Area
                type="monotone"
                dataKey="safeGwei"
                stroke="#10b981"
                strokeWidth={1.5}
                fill="transparent"
                name="Safe Gwei"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Minimal Bottom Legend */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-3 dotted-divider">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-sky-500 dark:bg-sky-400 inline-block rounded"></span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">Propose (Standard)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-zinc-400 inline-block"></span>
            <span>Fast (Priority)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-emerald-500 dark:bg-emerald-400 inline-block rounded"></span>
            <span>Safe (Slow)</span>
          </div>
        </div>

        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
          Updated live via WebSocket
        </span>
      </div>
    </div>
  );
}
