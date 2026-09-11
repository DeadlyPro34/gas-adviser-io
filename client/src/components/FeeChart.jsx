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

export default function FeeChart({ historyData, onTimeframeChange, currentHours = 24 }) {
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
        <div className="bg-[#0f172a]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
          <p className="text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            {data.fullTime}
          </p>
          <div className="border-t border-slate-800 pt-1.5 space-y-1">
            <div className="flex justify-between items-center text-purple-300">
              <span>Fast:</span>
              <span className="font-bold">{data.fastGwei} Gwei</span>
            </div>
            <div className="flex justify-between items-center text-blue-300 font-semibold">
              <span>Propose:</span>
              <span className="font-bold">{data.proposeGwei} Gwei</span>
            </div>
            <div className="flex justify-between items-center text-emerald-300">
              <span>Safe:</span>
              <span className="font-bold">{data.safeGwei} Gwei</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Historical Fee Trends</h3>
            <p className="text-xs text-slate-400">Gas price fluctuations over time</p>
          </div>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center bg-[#0b0f19] p-1 rounded-xl border border-slate-800/80 self-start sm:self-auto">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.hours}
              onClick={() => handleSelectHours(tf.hours)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedHours === tf.hours
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-[280px] w-full pt-2">
        {formattedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            No historical data available for this range yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="proposeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit=" Gwei"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="fastGwei"
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#fastGradient)"
                name="Fast Gwei"
              />
              <Area
                type="monotone"
                dataKey="proposeGwei"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#proposeGradient)"
                name="Propose Gwei"
              />
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

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2 border-t border-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-blue-500 rounded-full inline-block"></span>
          <span>Propose (Standard)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-purple-400 rounded-full border-dashed border-t border-purple-400 inline-block"></span>
          <span>Fast (Rapid)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-emerald-400 rounded-full inline-block"></span>
          <span>Safe (Slow)</span>
        </div>
      </div>
    </div>
  );
}
