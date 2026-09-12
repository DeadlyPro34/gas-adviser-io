import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, Trash2, CheckCircle2, RefreshCw, Zap, Lightbulb, ChevronDown } from 'lucide-react';

const CHAINS = [
  { slug: 'ethereum', name: 'Ethereum' },
  { slug: 'polygon',  name: 'Polygon' },
  { slug: 'arbitrum', name: 'Arbitrum' },
  { slug: 'base',     name: 'Base' },
];

export default function AlertManager({ socket, proposeGwei, onAlertTriggered }) {
  const [alerts, setAlerts] = useState([]);
  const [thresholdInput, setThresholdInput] = useState('');
  const [chainInput, setChainInput] = useState('ethereum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // Fetch active alerts
  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Socket listener for real-time alert trigger
  useEffect(() => {
    if (!socket) return;

    const handleAlertTriggered = (data) => {
      fetchAlerts();
      if (onAlertTriggered) {
        onAlertTriggered(data);
      }
    };

    socket.on('alertTriggered', handleAlertTriggered);

    return () => {
      socket.off('alertTriggered', handleAlertTriggered);
    };
  }, [socket, onAlertTriggered]);

  // Create alert
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const val = parseFloat(thresholdInput);
    if (!val || val <= 0) {
      setError('Please enter a valid threshold in Gwei.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/alerts', {
        chain: chainInput,
        thresholdGwei: val,
      });

      const chainName = CHAINS.find(c => c.slug === chainInput)?.name || chainInput;
      setSuccess(`Alert set for ${chainName} ≤ ${val} Gwei!`);
      setThresholdInput('');
      setAlerts((prev) => [res.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create alert.');
    } finally {
      setLoading(false);
    }
  };

  // ─── LAYER 2: Smart Default — set alert at ~80% of current gas price ───
  const handleSmartDefault = async () => {
    const smartThreshold = Math.round(proposeGwei * 0.8 * 10) / 10;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/alerts', {
        chain: chainInput,
        thresholdGwei: smartThreshold,
      });
      const chainName = CHAINS.find(c => c.slug === chainInput)?.name || chainInput;
      setSuccess(`Smart alert set for ${chainName} ≤ ${smartThreshold} Gwei!`);
      setAlerts((prev) => [res.data, ...prev]);
      setNudgeDismissed(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create smart alert.');
    } finally {
      setLoading(false);
    }
  };

  // Delete alert
  const handleDeleteAlert = async (id) => {
    try {
      await axios.delete(`/api/alerts/${id}`);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  // Compute smart suggestion value
  const smartSuggestion = Math.round(proposeGwei * 0.8 * 10) / 10;

  return (
    <div className="shadcn-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 dotted-divider">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              Gas Price Alerts
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Instant notification when fees drop below target
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          title="Refresh Alerts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── LAYER 2: Smart Nudge Banner ─── */}
      {alerts.length === 0 && !nudgeDismissed && (
        <div className="relative rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Don't miss cheap gas!
              </h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-1 leading-relaxed">
                You have no alerts configured. Gas prices fluctuate constantly — set an alert so you never miss a drop. We recommend <span className="font-bold text-amber-800 dark:text-amber-300">≤ {smartSuggestion} Gwei</span> based on current conditions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-11">
            <button
              onClick={handleSmartDefault}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              Enable Smart Alert ({smartSuggestion} Gwei)
            </button>
            <button
              onClick={() => setNudgeDismissed(true)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleCreateAlert} className="space-y-3">
        <div className="flex gap-3">
          {/* Chain Selector */}
          <div className="relative shrink-0">
            <select
              value={chainInput}
              onChange={(e) => setChainInput(e.target.value)}
              className="appearance-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-3 pr-8 text-sm font-bold focus:outline-none cursor-pointer h-full"
            >
              {CHAINS.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <input
              type="number"
              step="any"
              placeholder="e.g. 0.06 or 15"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="shadcn-input w-full pl-4 pr-14 py-3 rounded-xl text-sm font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500 font-bold pointer-events-none">
              Gwei
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Set Alert
          </button>
        </div>

        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {success && <p className="text-xs text-emerald-500 font-medium">{success}</p>}
      </form>

      {/* Alerts Table / List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          <span>Active & Historical Alerts</span>
          <span>{alerts.length} Total</span>
        </div>

        {alerts.length === 0 ? (
          <div className="shadcn-card-subtle p-3.5 rounded-xl text-center text-xs text-zinc-500 dark:text-zinc-400">
            No active alerts configured. Enter a target threshold above.
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                  alert.triggered
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'shadcn-card-subtle text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {alert.triggered ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {alert.chain.toUpperCase()} ≤ {alert.thresholdGwei} Gwei
                    </span>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      alert.triggered
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {alert.triggered ? 'TRIGGERED' : 'ACTIVE'}
                  </span>

                  <button
                    onClick={() => handleDeleteAlert(alert._id)}
                    className="p-1 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
