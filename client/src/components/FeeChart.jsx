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

/* ── inline styles matching the exact spec ── */
const cardStyle = {
  background: '#fff',
  border: '0.5px solid #e5e5e5',
  borderRadius: 16,
  padding: '20px 24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const pillGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const pillBase = {
  borderRadius: 6,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  lineHeight: 1.4,
};

const pillInactive = {
  ...pillBase,
  background: '#f5f5f5',
  color: '#888',
};

const pillActive = {
  ...pillBase,
  background: '#111',
  color: '#fff',
};

const formatGwei = (val) => {
  if (val == null || typeof val !== 'number') return val;
  return val < 1 ? val.toFixed(3) : val.toFixed(1);
};

/* ── Custom Tooltip ── */
const CustomChartTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div
      style={{
        background: '#fff',
        border: '0.5px solid #e0e0e0',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        fontSize: 12,
        minWidth: 180,
      }}
    >
      <div style={{ color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Clock style={{ width: 12, height: 12 }} />
        {data.fullTime}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>Propose (Standard)</span>
          <span style={{ color: '#00C9A7', fontWeight: 600, textAlign: 'right' }}>
            {formatGwei(data.proposeGwei)} Gwei
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>Fast (Priority)</span>
          <span style={{ color: '#555', fontWeight: 500, textAlign: 'right' }}>
            {formatGwei(data.fastGwei)} Gwei
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>Safe (Slow)</span>
          <span style={{ color: '#00A86B', fontWeight: 500, textAlign: 'right' }}>
            {formatGwei(data.safeGwei)} Gwei
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── Custom Crosshair Cursor ── */
const CustomCursor = ({ points, height }) => {
  if (!points || !points.length) return null;
  const { x } = points[0];
  return (
    <line
      x1={x}
      y1={0}
      x2={x}
      y2={height}
      stroke="#ccc"
      strokeWidth={1}
      strokeDasharray="4,2"
    />
  );
};

/* ── Custom Active Dot (filled circle on hover) ── */
const ActiveDot = ({ cx, cy, fill }) => {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={fill}
      stroke="#fff"
      strokeWidth={2}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
    />
  );
};

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

  const latest = formattedData[formattedData.length - 1] || null;

  const handleSelectHours = (hours) => {
    setSelectedHours(hours);
    if (onTimeframeChange) {
      onTimeframeChange(hours);
    }
  };

  /* Determine badge color based on label */
  const getBadgeStyle = (label) => {
    const l = (label || '').toLowerCase();
    if (l === 'low') return { background: '#E6FBF5', color: '#0A9B72', border: '0.5px solid #0A9B72' };
    if (l === 'normal') return { background: '#E6F0FB', color: '#2563EB', border: '0.5px solid #2563EB' };
    if (l === 'high') return { background: '#FEF3E6', color: '#D97706', border: '0.5px solid #D97706' };
    return { background: '#E6FBF5', color: '#0A9B72', border: '0.5px solid #0A9B72' };
  };

  return (
    <div style={cardStyle}>
      {/* ── Header Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#555' }}>
          <TrendingUp style={{ width: 14, height: 14, color: '#888' }} />
          <span>Gas Fee Trends Overview</span>
        </div>

        {/* Pill group */}
        <div style={pillGroupStyle}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.hours}
              onClick={() => handleSelectHours(tf.hours)}
              style={selectedHours === tf.hours ? pillActive : pillInactive}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Market Rate Display ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 4 }}>
            Market Propose Rate
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-0.5px' }}>
              {latest ? `${formatGwei(latest.proposeGwei)} Gwei` : '0.060 Gwei'}
            </span>
            {latest && (
              <span
                style={{
                  ...getBadgeStyle(latest.label),
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  lineHeight: 1.4,
                }}
              >
                {latest.label ? `${latest.label.toUpperCase()} · ${latest.percentile || 50}th percentile` : 'Live'}
              </span>
            )}
          </div>
        </div>

        {/* Range Label */}
        <div
          style={{
            border: '0.5px solid #e0e0e0',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12,
            color: '#555',
            background: '#fff',
          }}
        >
          Range: Last {selectedHours} Hours
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{ height: 270, width: '100%' }}>
        {formattedData.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 12,
            }}
          >
            No historical fee data available for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="proposeAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Horizontal grid only */}
              <CartesianGrid
                stroke="#f0f0f0"
                strokeWidth={1}
                vertical={false}
              />

              {/* X-Axis — monospace time */}
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 11, fill: '#aaa', fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />

              {/* Y-Axis — monospace values */}
              <YAxis
                tick={{ fontSize: 11, fill: '#aaa', fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val) => {
                  if (val == null) return '';
                  return val < 1 ? `${val.toFixed(3)}` : `${val.toFixed(1)}`;
                }}
                width={48}
              />

              {/* Tooltip with custom crosshair */}
              <Tooltip
                content={<CustomChartTooltip />}
                cursor={<CustomCursor />}
              />

              {/* Fast (Priority) — dashed gray */}
              <Area
                type="monotone"
                dataKey="fastGwei"
                stroke="#888"
                strokeWidth={1.5}
                strokeDasharray="5,3"
                fill="none"
                name="Fast Gwei"
                dot={false}
                activeDot={<ActiveDot fill="#888" />}
              />

              {/* Propose (Standard) — solid teal with area fill */}
              <Area
                type="monotone"
                dataKey="proposeGwei"
                stroke="#00C9A7"
                strokeWidth={2.5}
                fill="url(#proposeAreaFill)"
                name="Propose Gwei"
                dot={false}
                activeDot={<ActiveDot fill="#00C9A7" />}
              />

              {/* Safe (Slow) — short dashes green */}
              <Area
                type="monotone"
                dataKey="safeGwei"
                stroke="#00A86B"
                strokeWidth={1.5}
                strokeDasharray="3,2"
                fill="none"
                name="Safe Gwei"
                dot={false}
                activeDot={<ActiveDot fill="#00A86B" />}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Legend ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 14,
          borderTop: '1px solid #f0f0f0',
          marginTop: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Propose legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
            <svg width="20" height="2" style={{ display: 'block' }}>
              <line x1="0" y1="1" x2="20" y2="1" stroke="#00C9A7" strokeWidth="2.5" />
            </svg>
            <span style={{ fontWeight: 500 }}>Propose (Standard)</span>
          </div>
          {/* Fast legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
            <svg width="20" height="2" style={{ display: 'block' }}>
              <line x1="0" y1="1" x2="20" y2="1" stroke="#888" strokeWidth="1.5" strokeDasharray="5,3" />
            </svg>
            <span>Fast (Priority)</span>
          </div>
          {/* Safe legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
            <svg width="20" height="2" style={{ display: 'block' }}>
              <line x1="0" y1="1" x2="20" y2="1" stroke="#00A86B" strokeWidth="1.5" strokeDasharray="3,2" />
            </svg>
            <span>Safe (Slow)</span>
          </div>
        </div>

        <span style={{ fontSize: 11, color: '#aaa' }}>
          Updated live via WebSocket
        </span>
      </div>
    </div>
  );
}
