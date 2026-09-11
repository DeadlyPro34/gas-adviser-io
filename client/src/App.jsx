import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io as socketIOClient } from 'socket.io-client';
import {
  Activity,
  Wifi,
  WifiOff,
  X,
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  PanelLeft,
  Search,
  Calendar,
  Download,
  ArrowRight,
  TrendingUp,
  Gauge,
  Sparkles,
  DollarSign,
  Layers,
  HelpCircle,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';

import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';

import FeeGauge from './components/FeeGauge';
import FeeChart from './components/FeeChart';
import Recommendation from './components/Recommendation';
import TxCostCalculator from './components/TxCostCalculator';
import AlertManager from './components/AlertManager';

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? undefined : 'http://localhost:5000');

function App() {
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'forgot-password', 'dashboard', 'profile'

  // Theme state: dark by default (matches Image 2), light supported (matches Image 1)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Apply dark mode class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'profile') {
        setCurrentView('profile');
      } else if (hash === 'dashboard' || ['speedometer', 'trends', 'advisor', 'calculator', 'alerts'].includes(hash)) {
        setCurrentView('dashboard');
      } else if (['login', 'register', 'forgot-password'].includes(hash)) {
        setCurrentView(isAuthenticated ? 'dashboard' : hash);
      } else {
        setCurrentView(isAuthenticated ? 'dashboard' : 'login');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isAuthenticated]);

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

  // Export fee history as JSON
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(historyData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gas-history-${historyHours}h-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Historical gas fee data exported successfully.', 'info');
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
        `🔔 Gas Alert! Fees dropped to ${data.currentGwei} Gwei (target: ≤ ${data.thresholdGwei} Gwei).`,
        'alert'
      );
    },
    [addToast]
  );

  // Dynamic greeting matching "Good Night, Cameron" in screenshot
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: '☀️' };
    if (hour < 18) return { text: 'Good Afternoon', icon: '🌤️' };
    if (hour < 22) return { text: 'Good Evening', icon: '🌙' };
    return { text: 'Good Night', icon: '🌙' };
  };

  const greeting = getGreeting();

  // ─── Render Auth Pages if not authenticated ───
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col items-center justify-center">
        <Activity className="w-8 h-8 text-zinc-900 dark:text-white animate-spin mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Initializing Gas Adviser...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (currentView === 'register') return <RegisterPage onNavigate={navigate} />;
    if (currentView === 'forgot-password') return <ForgotPasswordPage onNavigate={navigate} />;
    return <LoginPage onNavigate={navigate} />;
  }

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Trader';

  // ─── Render Dashboard if authenticated ───
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex transition-colors duration-200 font-sans">
      {/* ═══ SHADCN SIDEBAR (Matches Image 1 & 2) ═══ */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-20'
        } shrink-0 bg-white dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-all duration-300 z-40 fixed lg:sticky top-0 h-screen overflow-hidden shadow-lg lg:shadow-none select-none`}
      >
        <div className="p-4 space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              {sidebarOpen && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
                      Gas Adviser
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700/60">
                      v1.0
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Ethereum Oracle</p>
                </div>
              )}
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="space-y-3.5">
            <div>
              {sidebarOpen && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2">
                  Dashboard
                </span>
              )}
              <div className="mt-1 space-y-0.5">
                {/* Active "Modern" Pill Button (matches Image 1 & 2) */}
                <button
                  onClick={() => navigate('dashboard')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all text-left cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span>Modern Dashboard</span>}
                </button>
              </div>
            </div>

            <div>
              {sidebarOpen && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2">
                  Feeds & Pages
                </span>
              )}
              <div className="mt-1 space-y-0.5">
                {/* User Profile Link */}
                <button
                  onClick={() => navigate('profile')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    currentView === 'profile'
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4 shrink-0 text-zinc-400" />
                  {sidebarOpen && <span>User Profile</span>}
                </button>

                <a
                  href="#speedometer"
                  onClick={() => currentView !== 'dashboard' && navigate('dashboard')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors"
                >
                  <Gauge className="w-4 h-4 shrink-0 text-zinc-400" />
                  {sidebarOpen && <span>Fee Speedometer</span>}
                </a>
                <a
                  href="#trends"
                  onClick={() => currentView !== 'dashboard' && navigate('dashboard')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors"
                >
                  <TrendingUp className="w-4 h-4 shrink-0 text-zinc-400" />
                  {sidebarOpen && <span>Fee Trends Chart</span>}
                </a>
                <a
                  href="#advisor"
                  onClick={() => currentView !== 'dashboard' && navigate('dashboard')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-zinc-400" />
                  {sidebarOpen && <span>Timing Advisor</span>}
                </a>
              </div>
            </div>

            <div>
              {sidebarOpen && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2">
                  DeFi Tools
                </span>
              )}
              <div className="mt-1 space-y-0.5">
                <a
                  href="#calculator"
                  onClick={() => currentView !== 'dashboard' && navigate('dashboard')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors"
                >
                  <DollarSign className="w-4 h-4 shrink-0 text-zinc-400" />
                  {sidebarOpen && <span>USD Cost Calculator</span>}
                </a>
                <a
                  href="#alerts"
                  onClick={() => currentView !== 'dashboard' && navigate('dashboard')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors"
                >
                  <Bell className="w-4 h-4 shrink-0 text-zinc-400" />
                  {sidebarOpen && <span>Threshold Alerts</span>}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Plan Widget (Matches Image 1 & 2 "Basic Plan 70%" card) */}
        {sidebarOpen && (
          <div className="p-4 space-y-2.5 shrink-0 border-t border-zinc-100 dark:border-zinc-800/60">
            <div className="shadcn-card-subtle p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Mainnet Plan</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-500">70%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 dark:bg-white w-[70%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">68/100 daily queries used</p>
              <button
                onClick={fetchCurrentFee}
                className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold text-[11px] shadow-sm transition-all cursor-pointer text-center"
              >
                Sync Oracle
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1 pt-0.5">
              <span className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
                <HelpCircle className="w-3.5 h-3.5" /> Help Center
              </span>
              <span className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
                <BookOpen className="w-3.5 h-3.5" /> Docs
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ═══ TOP NAVBAR (Matches Image 1 & 2) ═══ */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Sidebar Toggle + Search */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Toggle Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search gas oracle, alerts, blocks..."
                  className="shadcn-input w-full pl-8 pr-3 py-1.5 rounded-lg text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Actions, Theme Toggle, Bell, User Profile */}
            <div className="flex items-center gap-2.5">
              {/* Theme Toggle (Moon / Sun) */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
              </button>

              {/* Notification Bell with Badge */}
              <div className="relative">
                <button
                  onClick={() => navigate('dashboard')}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0c0c0e]"></span>
              </div>

              {/* Socket.io Live Status Pill */}
              <div
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                  socketConnected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                {socketConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Oracle</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span>Reconnecting</span>
                  </>
                )}
              </div>

              {/* User Profile + Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => navigate('profile')}
                  className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left"
                  title="Manage Profile & Security"
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center shadow-sm">
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">
                      {user?.fullName}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ TOAST NOTIFICATIONS ═══ */}
        {toasts.length > 0 && (
          <div className="fixed top-16 right-5 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl shadcn-card shadow-2xl animate-in slide-in-from-right-4 transition-all"
              >
                {toast.type === 'alert' ? (
                  <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <p className="text-xs font-medium leading-relaxed flex-1 text-zinc-800 dark:text-zinc-200">
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ═══ MAIN PAGE BODY ═══ */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto flex-1">
          {currentView === 'profile' ? (
            <ProfilePage onNavigate={navigate} alertsCount={0} />
          ) : (
            <>
              {/* ─── Hero Greeting & Action Buttons (Matches "Good Night, Cameron" in Image 1 & 2) ─── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                    {greeting.text}, {firstName} {greeting.icon}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Stay informed with today's Ethereum gas oracle analytics & predictions
                  </p>
                </div>

                {/* Top-Right Action Controls (Matches Refresh, Monthly, Export buttons in Image 1 & 2) */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      fetchCurrentFee();
                      fetchHistory(historyHours);
                      checkHealth();
                      addToast('Refreshed gas data from oracle.', 'info');
                    }}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Refresh All"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleTimeframeChange(historyHours === 24 ? 12 : 24)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{historyHours}h Window</span>
                  </button>

                  <button
                    onClick={handleExportData}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* ─── Update Pill / Notification Bar (Matches Image 1 & 2) ─── */}
              <div className="shadcn-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Update
                  </span>
                  <span className="text-zinc-400">·</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-zinc-400 hidden sm:inline">·</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium hidden sm:inline">
                    Ethereum gas rate currently {currentFee?.proposeGwei || 18} Gwei ({currentFee?.label?.toUpperCase() || 'NORMAL'}).
                  </span>
                </div>

                <a
                  href="#advisor"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-white hover:underline self-start sm:self-auto cursor-pointer"
                >
                  See Statistics <ArrowRight className="w-3 h-3" />
                </a>
              </div>

              {/* ─── Primary Grid: FeeChart + Speedometer Tiers ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="trends">
                <div className="lg:col-span-7 xl:col-span-8">
                  <FeeChart
                    historyData={historyData}
                    onTimeframeChange={handleTimeframeChange}
                    currentHours={historyHours}
                    isDark={isDark}
                  />
                </div>
                <div className="lg:col-span-5 xl:col-span-4" id="speedometer">
                  <FeeGauge feeData={currentFee} livePulse={livePulse} />
                </div>
              </div>

              {/* ─── Middle 3 Metric Cards ─── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="shadcn-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    24h Average Fee
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      {currentFee?.proposeGwei ? (currentFee.proposeGwei * 0.95).toFixed(1) : '18.2'}
                      <span className="text-xs font-normal text-zinc-500 ml-1">Gwei</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      40% Stable
                    </span>
                  </div>
                  <div className="pt-2 dotted-divider">
                    <a
                      href="#trends"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      See Statistics <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="shadcn-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Network Activity Index
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      {currentFee?.label === 'low' ? 'Optimal' : currentFee?.label === 'high' ? 'Congested' : 'Moderate'}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                      {currentFee?.percentile || 50}% Pct
                    </span>
                  </div>
                  <div className="pt-2 dotted-divider">
                    <a
                      href="#advisor"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      See Advisory <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="shadcn-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Active Threshold Watchers
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      Socket.io
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {socketConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <div className="pt-2 dotted-divider">
                    <a
                      href="#alerts"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      Manage Alerts <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* ─── Timing Advisor ─── */}
              <div id="advisor">
                <Recommendation feeData={currentFee} />
              </div>

              {/* ─── Two-column: Calculator & Alerts ─── */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div id="calculator">
                  <TxCostCalculator proposeGwei={currentFee?.proposeGwei || 20} />
                </div>
                <div id="alerts">
                  <AlertManager
                    socket={socket}
                    proposeGwei={currentFee?.proposeGwei || 20}
                    onAlertTriggered={handleAlertTriggered}
                  />
                </div>
              </div>

              {/* ─── Backend Status Panel ─── */}
              <div className="shadcn-card p-5">
                <div className="flex items-center justify-between pb-3 dotted-divider mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                      System Architecture & Health
                    </h3>
                  </div>
                  <button
                    onClick={checkHealth}
                    disabled={healthLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin' : ''}`} />
                    <span>Ping Health</span>
                  </button>
                </div>

                {healthLoading ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 py-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                    <span>Checking server status...</span>
                  </div>
                ) : !health ? (
                  <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Backend server unreachable</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Ensure server is running on port 5000 (<code>npm run dev</code> in <code>/server</code>).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="shadcn-card-subtle p-3 rounded-lg">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Express Server</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          {health.status}
                        </span>
                      </div>
                    </div>
                    <div className="shadcn-card-subtle p-3 rounded-lg">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Database Persistence</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            health.dbState === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        ></span>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                          {health.dbState}
                        </span>
                      </div>
                    </div>
                    <div className="shadcn-card-subtle p-3 rounded-lg">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">WebSocket Transport</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {socketConnected ? 'Socket.io Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 px-6 bg-white dark:bg-[#0c0c0e] text-center text-xs text-zinc-500 dark:text-zinc-400">
          Gas Adviser &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Professional DeFi Fee & Timing Predictor &nbsp;·&nbsp; Shadcn Design System
        </footer>
      </div>
    </div>
  );
}

export default App;

