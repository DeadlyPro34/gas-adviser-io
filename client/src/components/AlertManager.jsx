import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, Trash2, CheckCircle, AlertOctagon, RefreshCw } from 'lucide-react';

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
      console.log('🔔 alertTriggered received in component:', data);
      // Refresh list
      fetchAlerts();
      // Notify parent app for toast
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
      console.error('Failed to create alert:', err);
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
    <div className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Gas Price Alerts (Milestone 5)</h3>
            <p className="text-xs text-slate-400">Get notified via Socket.io when fees drop below your target</p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Refresh Alerts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Create Alert Form */}
      <form onSubmit={handleCreateAlert} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              step="1"
              placeholder="e.g. 15 (Threshold in Gwei)"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none"
            />
            <span className="absolute right-4 top-3 text-xs text-slate-500 font-semibold">Gwei</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Set Threshold Alert
          </button>
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {success && <p className="text-xs text-emerald-400 font-medium">{success}</p>}
      </form>

      {/* Active & Triggered Alerts List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-400">Your Active & Historical Alerts</h4>

        {alerts.length === 0 ? (
          <div className="bg-[#0b0f19]/60 border border-slate-800/60 rounded-xl p-4 text-center text-xs text-slate-500">
            No active alerts configured. Set a Gwei threshold above to test!
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                  alert.triggered
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#0b0f19]/80 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {alert.triggered ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {alert.chain.toUpperCase()} ≤ {alert.thresholdGwei} Gwei
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Created: {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      alert.triggered
                        ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {alert.triggered ? 'TRIGGERED' : 'ACTIVE'}
                  </span>

                  <button
                    onClick={() => handleDeleteAlert(alert._id)}
                    className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
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
