import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ShieldCheck, Cpu, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/health');
      setHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch backend health:', err);
      setError('Could not connect to backend server at /api/health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                DeFi Fee & Timing Predictor
              </h1>
              <p className="text-xs text-slate-400">Ethereum Gas Oracle & Smart Transaction Advisor</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Milestone 1 — Scaffold Ready
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        {/* Welcome Hero Banner */}
        <div className="glass-card rounded-2xl p-8 border border-slate-800 bg-gradient-to-b from-[#131b2e] to-[#0f172a] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu className="w-4 h-4" /> MERN Stack + Socket.io + node-cron
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Real-time Gas Tracking & Predictive Analytics
            </h2>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
              Never overpay for gas. Track live Ethereum gwei rates, view rolling historical fee trends,
              and receive plain-language recommendations on whether to execute now or wait.
            </p>
          </div>
        </div>

        {/* Backend Connection Status Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-[#131b2e]/80 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-slate-200">Backend Server Health Check</h3>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium border border-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Health
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              Ping backend service...
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
                <p className="text-xs text-red-400/80 mt-1">Make sure the Express backend server is running on port 5000 (`npm run dev` in `/server`).</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0b0f19]/80 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Server Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400 uppercase">{health?.status}</span>
                </div>
              </div>

              <div className="bg-[#0b0f19]/80 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Database Connection</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${health?.dbState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className="text-sm font-medium text-slate-200 capitalize">{health?.dbState}</span>
                </div>
              </div>

              <div className="bg-[#0b0f19]/80 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400">Last Ping</span>
                <div className="text-sm font-medium text-slate-300 mt-1 truncate">
                  {new Date(health?.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 bg-[#090d16] text-center text-xs text-slate-500">
        P04 — DeFi Fee & Timing Predictor &copy; 2026 Hackathon Edition
      </footer>
    </div>
  );
}

export default App;
