const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { startPolling } = require('./jobs/pollFees');
const FeeHistory = require('./models/FeeHistory');
const UserAlert = require('./models/UserAlert');
const { computeFeePercentile } = require('./helpers/feeHelper');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Create HTTP server and attach Socket.io ─────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// ─── Socket.io connection logging ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket.io] 🟢 Client connected — id: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`[socket.io] 🔴 Client disconnected — id: ${socket.id}, reason: ${reason}`);
  });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/defi-gas-predictor';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(' Connected to MongoDB successfully.');
    // Start polling Etherscan for gas prices once DB is ready
    startPolling(io);
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

// ─── Milestone 5 — Alerts API Routes ─────────────────────────────────────────

/**
 * POST /api/alerts
 * Creates a new user alert. Body: { chain?, thresholdGwei }
 */
app.post('/api/alerts', async (req, res) => {
  try {
    const { chain, thresholdGwei } = req.body;

    if (thresholdGwei == null || typeof thresholdGwei !== 'number' || thresholdGwei <= 0) {
      return res.status(400).json({
        error: 'thresholdGwei is required and must be a positive number.',
      });
    }

    const alert = await UserAlert.create({
      chain: chain || 'ethereum',
      thresholdGwei,
    });

    console.log(`[alerts] ✅ New alert created — chain: ${alert.chain}, threshold: ${alert.thresholdGwei} gwei`);

    return res.status(201).json(alert);
  } catch (err) {
    console.error('[POST /api/alerts] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

httpServer.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

