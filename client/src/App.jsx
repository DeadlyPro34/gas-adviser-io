import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';
import {
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  X,
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import FeeGauge from './components/FeeGauge';
import FeeChart from './components/FeeChart';
import Recommendation from './components/Recommendation';
import TxCostCalculator from './components/TxCostCalculator';
import AlertManager from './components/AlertManager';

// ─── Socket.io client (connect once) ─────────────────────────────────────────
const SOCKET_URL = 'http://localhost:5000';

function App() {
  // Backend health
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Fee data
  const [currentFee, setCurrentFee] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyHours, setHistoryHours] = useState(24);

  // Socket
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [livePulse, setLivePulse] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // ─── Toast helper ────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Health Check ────────────────────────────────────────────────────────
  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await axios.get('/api/health');
      setHealth(res.data);
    } catch (err) {
      console.error('Health check failed:', err);
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  // ─── Fetch Current Fee ───────────────────────────────────────────────────
  const fetchCurrentFee = async () => {
    try {
      const res = await axios.get('/api/fees/current');
      setCurrentFee(res.data);
    } catch (err) {
      console.error('Failed to fetch current fee:', err);
    }
  };

  // ─── Fetch History ───────────────────────────────────────────────────────
  const fetchHistory = async (hours) => {
    try {
      const res = await axios.get(`/api/fees/history?hours=${hours}`);
      setHistoryData(res.data);
    } catch (err) {
      console.error('Failed to fetch fee history:', err);
    }
  };

  const handleTimeframeChange = (hours) => {
    setHistoryHours(hours);
    fetchHistory(hours);
  };

  // ─── Socket.io Initialization ────────────────────────────────────────────
  useEffect(() => {
    const newSocket = socketIOClient(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setSocketConnected(true);
      console.log('[App] Socket.io connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
      console.log('[App] Socket.io disconnected');
    });

    // Milestone 4: Real-time fee updates
    newSocket.on('feeUpdate', (data) => {
      console.log('[App] feeUpdate received:', data);
      setCurrentFee(data);

      // Append to history chart data
      setHistoryData((prev) => [...prev, data]);

      // Trigger live pulse animation
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1200);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // ─── Initial Data Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    checkHealth();
    fetchCurrentFee();
    fetchHistory(historyHours);
  }, []);

  // ─── Alert Triggered Handler (for toast) ─────────────────────────────────
  const handleAlertTriggered = useCallback(
    (data) => {
      addToast(
        `🔔 Alert Triggered! Gas fees dropped to ${data.currentGwei} Gwei — below your ${data.thresholdGwei} Gwei threshold.`,
        'alert'
      );
    },
    [addToast]
  );

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* ═══ HEADER ═══ */}
      <header className="border-b border-slate-800/60 bg-[#0a0e1a]/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 leading-tight">
                DeFi Fee & Timing Predictor
              </h1>
              <p className="text-[10px] text-slate-500 tracking-wide">
                Ethereum Gas Oracle & Smart Transaction Advisor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Socket.io Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                socketConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
              }`}
            >
              {socketConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Disconnected
                </>
              )}
            </span>

            {/* Backend Status Pill */}
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
                health?.dbState === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  health?.dbState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              DB: {health?.dbState || 'checking...'}
            </span>
          </div>
        </div>
      </header>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-6 z-[100] space-y-3 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-right-5 transition-all ${
                toast.type === 'alert'
                  ? 'bg-amber-900/80 border-amber-500/50 text-amber-100 shadow-amber-500/15'
                  : 'bg-blue-900/80 border-blue-500/50 text-blue-100 shadow-blue-500/15'
              }`}
            >
              {toast.type === 'alert' ? (
                <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              )}
              <p className="text-xs font-medium leading-relaxed flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Hero Banner */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-b from-[#111827] to-[#0a0e1a] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none animate-glow"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none animate-glow"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu className="w-3.5 h-3.5" /> MERN Stack + Socket.io + node-cron
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Real-time Gas Tracking &{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Predictive Analytics
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
              Never overpay for gas. Track live Ethereum gwei rates, view rolling historical fee
              trends, and receive plain-language recommendations on when to transact.
            </p>
          </div>
        </div>

        {/* Fee Gauge */}
        <FeeGauge feeData={currentFee} livePulse={livePulse} />

        {/* Recommendation Engine */}
        <Recommendation feeData={currentFee} />

        {/* Fee History Chart */}
        <FeeChart
          historyData={historyData}
          onTimeframeChange={handleTimeframeChange}
          currentHours={historyHours}
        />

        {/* Two-column layout: Cost Calculator + Alert Manager */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TxCostCalculator proposeGwei={currentFee?.proposeGwei || 20} />
          <AlertManager
            socket={socket}
            proposeGwei={currentFee?.proposeGwei || 20}
            onAlertTriggered={handleAlertTriggered}
          />
        </div>

        {/* Backend Health Check — Compact */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/60 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-slate-200">Backend Server Status</h3>
            </div>
            <button
              onClick={checkHealth}
              disabled={healthLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white text-[11px] font-medium transition-all cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {healthLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              Pinging backend...
            </div>
          ) : !health ? (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cannot reach backend server</p>
                <p className="text-[10px] text-rose-400/70 mt-0.5">
                  Make sure Express is running on port 5000 (<code>npm run dev</code> in{' '}
                  <code>/server</code>).
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#0b0f19]/70 border border-slate-800/60 rounded-xl px-4 py-3">
                <span className="text-[10px] text-slate-500">Server</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase">{health.status}</span>
                </div>
              </div>
              <div className="bg-[#0b0f19]/70 border border-slate-800/60 rounded-xl px-4 py-3">
                <span className="text-[10px] text-slate-500">Database</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      health.dbState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  ></span>
                  <span className="text-xs font-semibold text-slate-200 capitalize">
                    {health.dbState}
                  </span>
                </div>
              </div>
              <div className="bg-[#0b0f19]/70 border border-slate-800/60 rounded-xl px-4 py-3">
                <span className="text-[10px] text-slate-500">Socket.io</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  ></span>
                  <span className="text-xs font-semibold text-slate-200">
                    {socketConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-800/50 py-5 px-6 bg-[#070a12] text-center">
        <p className="text-[11px] text-slate-500">
          P04 — DeFi Fee & Timing Predictor &copy; {new Date().getFullYear()} Hackathon Edition
          &nbsp;·&nbsp; Built with MERN + Socket.io + Recharts
        </p>
      </footer>
    </div>
  );
}

export default App;
