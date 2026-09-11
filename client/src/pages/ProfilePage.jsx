import React, { useState } from 'react';
import axios from 'axios';
import {
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  Bell,
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Lock,
  Sparkles,
  Zap,
  Save,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage({ onNavigate, alertsCount = 0 }) {
  const { user, logout, updateUser } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Gas Preference State
  const [defaultThreshold, setDefaultThreshold] = useState(15);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [defaultWindow, setDefaultWindow] = useState('24h');
  const [prefSuccess, setPrefSuccess] = useState('');

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await axios.put('/api/auth/profile', { fullName });
      if (updateUser && res.data?.user) {
        updateUser(res.data.user);
      }
      setProfileSuccess(res.data.message || 'Profile updated successfully.');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err?.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPwSuccess(res.data.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err) {
      setPwError(err?.response?.data?.error || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPrefSuccess('Gas preferences saved successfully.');
    setTimeout(() => setPrefSuccess(''), 3000);
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Sep 2026';

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* ═══ TOP BREADCRUMB & BACK NAVIGATION ═══ */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f0f12] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-300 font-semibold">User Profile</span>
        </div>
      </div>

      {/* ═══ PROFILE HERO CARD ═══ */}
      <div className="shadcn-card p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar Circle */}
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-black text-2xl shadow-xl">
              {initials}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{user?.fullName}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                  Active Trader
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                {user?.email}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                Member since {memberSince}
              </p>
            </div>
          </div>

          {/* Quick Sign Out Action */}
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ═══ 4 STATS METRIC CARDS (Shadcn Style) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="shadcn-card p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Configured Alerts</span>
            <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{alertsCount}</div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Threshold triggers active</p>
        </div>

        <div className="shadcn-card p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Oracle Connection</span>
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Live WS</div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Socket.io EIP-1559 stream</p>
        </div>

        <div className="shadcn-card p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Subscription Tier</span>
            <Zap className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Mainnet</div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">68/100 daily queries</p>
        </div>

        <div className="shadcn-card p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Account Security</span>
            <ShieldCheck className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Protected</div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">JWT Token encrypted</p>
        </div>
      </div>

      {/* ═══ TWO-COLUMN SETTINGS SECTION ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Personal Info Form ── */}
        <div className="shadcn-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 dotted-divider">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">Personal Details</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Update your account name and identity</p>
              </div>
            </div>
          </div>

          {profileError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}
          {profileSuccess && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address <span className="text-[10px] text-zinc-500">(Read-only)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs opacity-60 cursor-not-allowed"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Default Chain</label>
              <input
                type="text"
                value="Ethereum Mainnet (EIP-1559)"
                disabled
                className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs opacity-60 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {profileLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Name Changes
            </button>
          </form>
        </div>

        {/* ── Security & Change Password ── */}
        <div className="shadcn-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 dotted-divider">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                <KeyRound className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">Security & Password</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Update your password credentials</p>
              </div>
            </div>
          </div>

          {pwError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pwSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={pwLoading || !currentPassword || !newPassword}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white font-semibold text-xs border border-zinc-800 dark:border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {pwLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* ═══ GAS TRADING PREFERENCES ═══ */}
      <div className="shadcn-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 dotted-divider">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">Trading Preferences</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Customize gas thresholds and prediction defaults</p>
            </div>
          </div>
        </div>

        {prefSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{prefSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Default Alert Target
            </label>
            <div className="relative">
              <input
                type="number"
                value={defaultThreshold}
                onChange={(e) => setDefaultThreshold(e.target.value)}
                className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs"
              />
              <span className="absolute right-3 top-2 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">Gwei</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Default Chart Range
            </label>
            <select
              value={defaultWindow}
              onChange={(e) => setDefaultWindow(e.target.value)}
              className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs"
            >
              <option value="6h">Last 6 Hours</option>
              <option value="12h">Last 12 Hours</option>
              <option value="24h">Last 24 Hours (Recommended)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Browser Alerts
            </label>
            <button
              type="button"
              onClick={() => setSoundAlerts(!soundAlerts)}
              className={`w-full py-2 px-3.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                soundAlerts
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
              }`}
            >
              {soundAlerts ? '🔔 Enabled (Desktop Toasts)' : '🔕 Muted'}
            </button>
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Trading Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
