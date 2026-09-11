const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { startPolling } = require('./jobs/pollFees');
const FeeHistory = require('./models/FeeHistory');
const { computeFeePercentile } = require('./helpers/feeHelper');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/defi-gas-predictor';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(' Connected to MongoDB successfully.');
    // Start polling Etherscan for gas prices once DB is ready
    startPolling();
  })
  .catch((err) => {
    console.warn(' MongoDB connection warning:', err.message);
    console.warn(' Running without database persistence until MONGO_URI is configured.');
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'DeFi Fee & Timing Predictor Backend is running.',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ─── Milestone 3 — Fee API Routes ────────────────────────────────────────────

/**
 * GET /api/fees/current
 * Returns the most recent FeeHistory document, enriched with a 24-hour
 * percentile rank and a label ("low" | "normal" | "high").
 */
app.get('/api/fees/current', async (req, res) => {
  try {
    const latest = await FeeHistory.findOne().sort({ timestamp: -1 }).lean();

    if (!latest) {
      return res.status(404).json({ error: 'No fee data available yet.' });
    }

    // Fetch the last 24 hours of readings for percentile calculation
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history24h = await FeeHistory.find(
      { timestamp: { $gte: twentyFourHoursAgo } },
      { proposeGwei: 1, _id: 0 }
    ).lean();

    const { percentile, label } = computeFeePercentile(latest, history24h);

    return res.status(200).json({ ...latest, percentile, label });
  } catch (err) {
    console.error('[/api/fees/current] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/fees/history?hours=24
 * Returns FeeHistory documents from the last N hours (default 24),
 * sorted oldest → newest for charting.
 */
app.get('/api/fees/history', async (req, res) => {
  try {
    const hours = Math.max(1, parseInt(req.query.hours, 10) || 24);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const history = await FeeHistory.find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json(history);
  } catch (err) {
    console.error('[/api/fees/history] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
