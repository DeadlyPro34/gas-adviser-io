import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AlertManager({ socket, proposeGwei, onAlertTriggered }) {
  const [alerts, setAlerts] = useState([]);
  const [thresholdInput, setThresholdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
        chain: 'ethereum',
        thresholdGwei: val,
      });

      setSuccess(`Alert set for ≤ ${val} Gwei!`);
      setThresholdInput('');
      setAlerts((prev) => [res.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create alert.');
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

  return (
    <div className="shadcn-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 dotted-divider">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <Bell className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Gas Price Alerts
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Instant notification when fees drop below target
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          title="Refresh Alerts"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Form (Matches Image 3 Shadcn form input & solid button) */}
      <form onSubmit={handleCreateAlert} className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="number"
              step="1"
              placeholder="e.g. 15"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="shadcn-input w-full px-3.5 py-2 rounded-lg text-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
            <span className="absolute right-3.5 top-2.5 text-[11px] text-zinc-400 font-semibold">
              Gwei
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Set Alert
          </button>
        </div>

        {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
        {success && <p className="text-[11px] text-emerald-500 font-medium">{success}</p>}
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
