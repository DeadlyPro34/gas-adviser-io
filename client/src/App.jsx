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
  LogOut,
  User as UserIcon
} from 'lucide-react';

import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import FeeGauge from './components/FeeGauge';
import FeeChart from './components/FeeChart';
import Recommendation from './components/Recommendation';
import TxCostCalculator from './components/TxCostCalculator';
import AlertManager from './components/AlertManager';

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? undefined : 'http://localhost:5000');

function App() {
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'forgot-password'

  // Dashboard state
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [currentFee, setCurrentFee] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyHours, setHistoryHours] = useState(24);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [livePulse, setLivePulse] = useState(false);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'login';
      if (['login', 'register', 'forgot-password'].includes(hash)) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (view) => {
    window.location.hash = view;
    setCurrentView(view);
  };

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 8000);
  }, []);

  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await axios.get('/api/health');
      setHealth(res.data);
    } catch (err) {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchCurrentFee = async () => {
    try {
      const res = await axios.get('/api/fees/current');
      setCurrentFee(res.data);
    } catch (err) {}
  };

  const fetchHistory = async (hours) => {
    try {
      const res = await axios.get(`/api/fees/history?hours=${hours}`);
      setHistoryData(res.data);
    } catch (err) {}
  };

  const handleTimeframeChange = (hours) => {
    setHistoryHours(hours);
    fetchHistory(hours);
  };

  // Only init dashboard data if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    checkHealth();
    fetchCurrentFee();
    fetchHistory(historyHours);

    const newSocket = socketIOClient(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => setSocketConnected(true));
    newSocket.on('disconnect', () => setSocketConnected(false));
    newSocket.on('feeUpdate', (data) => {
      setCurrentFee(data);
      setHistoryData((prev) => [...prev, data]);
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1200);
    });

    return () => newSocket.disconnect();
    // eslint-disable-next-line
  }, [isAuthenticated]);

  const handleAlertTriggered = useCallback(
    (data) => {
      addToast(
        `🔔 Alert Triggered! Gas fees dropped to ${data.currentGwei} Gwei — below your ${data.thresholdGwei} Gwei threshold.`,
        'alert'
      );
    },
    [addToast]
  );

  // ─── Render Auth Pages if not authenticated ───
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
        <p className="text-slate-400 font-medium">Loading Gas Adviser...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (currentView === 'register') return <RegisterPage onNavigate={navigate} />;
    if (currentView === 'forgot-password') return <ForgotPasswordPage onNavigate={navigate} />;
    return <LoginPage onNavigate={navigate} />;
  }

  // ─── Render Dashboard if authenticated ───
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

          <div className="flex items-center gap-4">
            {/* Socket.io Status */}
            <span
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
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

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
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
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-b from-[#111827] to-[#0a0e1a] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none animate-glow"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none animate-glow"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu className="w-3.5 h-3.5" /> MERN Stack + Socket.io + JWT Auth
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Welcome back, {user?.fullName?.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
              Track live Ethereum gwei rates, view historical fee trends, and receive plain-language recommendations on when to transact.
            </p>
          </div>
        </div>

        <FeeGauge feeData={currentFee} livePulse={livePulse} />
        <Recommendation feeData={currentFee} />
        <FeeChart historyData={historyData} onTimeframeChange={handleTimeframeChange} currentHours={historyHours} />
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TxCostCalculator proposeGwei={currentFee?.proposeGwei || 20} />
          <AlertManager socket={socket} proposeGwei={currentFee?.proposeGwei || 20} onAlertTriggered={handleAlertTriggered} />
        </div>

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
                  Make sure Express is running on port 5000 (<code>npm run dev</code> in <code>/server</code>).
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
                  <span className={`w-2 h-2 rounded-full ${health.dbState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className="text-xs font-semibold text-slate-200 capitalize">{health.dbState}</span>
                </div>
              </div>
              <div className="bg-[#0b0f19]/70 border border-slate-800/60 rounded-xl px-4 py-3">
                <span className="text-[10px] text-slate-500">Socket.io</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  <span className="text-xs font-semibold text-slate-200">{socketConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800/50 py-5 px-6 bg-[#070a12] text-center">
        <p className="text-[11px] text-slate-500">
          DeFi Fee & Timing Predictor &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Built with MERN + Socket.io + Auth
        </p>
      </footer>
    </div>
  );
}

export default App;
