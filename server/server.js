const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { startPolling } = require('./jobs/pollFees');
const { computeFeePercentile } = require('./helpers/feeHelper');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Create HTTP server and attach Socket.io ─────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── In-Memory Fallback Store ─────────────────────────────────────────────────
// Used when MongoDB is unavailable. Seeded with 24h of realistic mock data.
let dbReady = false;
let memFeeHistory = [];
let memAlerts = [];

function generateMockHistory() {
  const now = Date.now();
  const totalPoints = 48;
  const intervalMs = (24 * 60 * 60 * 1000) / totalPoints;
  const result = [];
  let base = 18;
  for (let i = totalPoints; i >= 0; i--) {
    const timestamp = new Date(now - i * intervalMs);
    const sine = Math.sin((i / totalPoints) * Math.PI * 4) * 6;
    const noise = (Math.random() - 0.48) * 4;
    const proposeGwei = Math.max(8, Math.round((base + sine + noise) * 10) / 10);
    const safeGwei    = Math.max(6, Math.round(proposeGwei * 0.85 * 10) / 10);
    const fastGwei    = Math.round(proposeGwei * 1.25 * 10) / 10;
    result.push({
      _id: `mock-${i}`,
      timestamp,
      chain: 'ethereum',
      safeGwei,
      proposeGwei,
      fastGwei,
    });
  }
  return result;
}

// ─── Socket.io connection logging ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket.io] 🟢 Client connected — id: ${socket.id}`);
  socket.on('disconnect', (reason) => {
    console.log(`[socket.io] 🔴 Client disconnected — id: ${socket.id}, reason: ${reason}`);
  });
});

// ─── MongoDB Connection (optional — falls back to in-memory) ─────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/defi-gas-predictor';

mongoose
  .connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 })
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully.');
    dbReady = true;
    // Lazy-load DB-dependent modules only when connected
    const { seedInitialDataIfNeeded } = require('./helpers/seedHelper');
    await seedInitialDataIfNeeded();
    startPolling(io);
  })
  .catch((err) => {
    console.warn('⚠️  MongoDB unavailable:', err.message);
    console.warn('🔄 Starting in offline/demo mode with in-memory mock data.');
    // Seed in-memory data for demo mode
    memFeeHistory = generateMockHistory();
    console.log(`[mock] Generated ${memFeeHistory.length} in-memory fee records.`);
    // Start a simple mock cron that emits Socket.io events every 20 seconds
    startMockPolling();
  });

// ─── Mock Polling (offline mode) ─────────────────────────────────────────────
function startMockPolling() {
  const cron = require('node-cron');
  cron.schedule('*/20 * * * * *', () => {
    const last = memFeeHistory[memFeeHistory.length - 1] || { proposeGwei: 18, safeGwei: 15, fastGwei: 22 };
    const noise = (Math.random() - 0.48) * 3;
    const proposeGwei = Math.max(6, Math.round((last.proposeGwei + noise) * 10) / 10);
    const safeGwei    = Math.max(4, Math.round(proposeGwei * 0.85 * 10) / 10);
    const fastGwei    = Math.round(proposeGwei * 1.25 * 10) / 10;

    const doc = {
      _id: `mock-live-${Date.now()}`,
      timestamp: new Date(),
      chain: 'ethereum',
      safeGwei,
      proposeGwei,
      fastGwei,
    };

    memFeeHistory.push(doc);
    // Keep last 72 hours max
    if (memFeeHistory.length > 144) memFeeHistory.shift();

    const { percentile, label } = computeFeePercentile(doc, memFeeHistory);
    const payload = { ...doc, percentile, label };

    io.emit('feeUpdate', payload);
    console.log(`[mock-poll] 📡 Emitted feeUpdate — ${proposeGwei} Gwei (${label})`);

    // Check in-memory alerts
    const triggered = memAlerts.filter(
      (a) => !a.triggered && a.thresholdGwei >= proposeGwei
    );
    triggered.forEach((a) => {
      a.triggered = true;
      io.emit('alertTriggered', {
        alertId: a._id,
        chain: a.chain,
        thresholdGwei: a.thresholdGwei,
        currentGwei: proposeGwei,
        triggeredAt: new Date().toISOString(),
      });
      console.log(`[mock-poll] 🔔 Alert triggered — threshold ${a.thresholdGwei} Gwei`);
    });
  });
  console.log('[mock-poll] Mock cron started — emitting feeUpdate every 20 seconds.');
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'DeFi Fee & Timing Predictor Backend is running.',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'offline (demo mode)',
  });
});

// ─── Fee API — current ────────────────────────────────────────────────────────
app.get('/api/fees/current', async (req, res) => {
  try {
    if (!dbReady) {
      // Serve from in-memory
      const latest = memFeeHistory[memFeeHistory.length - 1];
      if (!latest) return res.status(404).json({ error: 'No data yet.' });
      const { percentile, label } = computeFeePercentile(latest, memFeeHistory);
      return res.status(200).json({ ...latest, percentile, label });
    }

    const FeeHistory = require('./models/FeeHistory');
    const latest = await FeeHistory.findOne().sort({ timestamp: -1 }).lean();
    if (!latest) return res.status(404).json({ error: 'No fee data available yet.' });

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

// ─── Fee API — history ────────────────────────────────────────────────────────
app.get('/api/fees/history', async (req, res) => {
  try {
    const hours = Math.min(168, Math.max(1, parseInt(req.query.hours, 10) || 24));
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    if (!dbReady) {
      const filtered = memFeeHistory.filter((d) => new Date(d.timestamp) >= since);
      return res.status(200).json(filtered);
    }

    const FeeHistory = require('./models/FeeHistory');
    const history = await FeeHistory.find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .lean();
    return res.status(200).json(history);
  } catch (err) {
    console.error('[/api/fees/history] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Alerts API — GET (auth-protected, scoped to user) ────────────────────────
app.get('/api/alerts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!dbReady) {
      const userAlerts = memAlerts.filter((a) => a.userId === userId);
      return res.status(200).json([...userAlerts].reverse());
    }
    const UserAlert = require('./models/UserAlert');
    const alerts = await UserAlert.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json(alerts);
  } catch (err) {
    console.error('[GET /api/alerts] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Alerts API — POST (auth-protected, stamps userId) ────────────────────────
app.post('/api/alerts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chain, thresholdGwei } = req.body;
    if (thresholdGwei == null || typeof thresholdGwei !== 'number' || thresholdGwei <= 0) {
      return res.status(400).json({ error: 'thresholdGwei is required and must be a positive number.' });
    }

    // ── Per-user alert cap (max 10 active alerts) ──
    const MAX_ALERTS = 10;
    if (!dbReady) {
      const count = memAlerts.filter((a) => a.userId === userId && !a.triggered).length;
      if (count >= MAX_ALERTS) {
        return res.status(429).json({ error: `You can have at most ${MAX_ALERTS} active alerts.` });
      }
    } else {
      const UserAlert = require('./models/UserAlert');
      const count = await UserAlert.countDocuments({ userId, triggered: false });
      if (count >= MAX_ALERTS) {
        return res.status(429).json({ error: `You can have at most ${MAX_ALERTS} active alerts.` });
      }
    }

    if (!dbReady) {
      const newAlert = {
        _id: `mem-alert-${Date.now()}`,
        userId,
        chain: chain || 'ethereum',
        thresholdGwei,
        createdAt: new Date(),
        triggered: false,
      };
      memAlerts.push(newAlert);
      console.log(`[alerts] ✅ In-memory alert created — ${newAlert.chain} ≤ ${thresholdGwei} Gwei (user: ${userId})`);
      return res.status(201).json(newAlert);
    }

    const UserAlert = require('./models/UserAlert');
    const alert = await UserAlert.create({ userId, chain: chain || 'ethereum', thresholdGwei });
    console.log(`[alerts] ✅ Alert created — chain: ${alert.chain}, threshold: ${alert.thresholdGwei} Gwei (user: ${userId})`);
    return res.status(201).json(alert);
  } catch (err) {
    console.error('[POST /api/alerts] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Alerts API — DELETE (auth-protected, ownership check) ───────────────────
app.delete('/api/alerts/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!dbReady) {
      const idx = memAlerts.findIndex((a) => a._id === id && a.userId === userId);
      if (idx === -1) return res.status(404).json({ error: 'Alert not found.' });
      memAlerts.splice(idx, 1);
      return res.status(200).json({ message: 'Alert deleted.', id });
    }

    const UserAlert = require('./models/UserAlert');
    const deleted = await UserAlert.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ error: 'Alert not found.' });
    console.log(`[alerts] 🗑️ Alert deleted — ID: ${id} (user: ${userId})`);
    return res.status(200).json({ message: 'Alert deleted successfully.', id });
  } catch (err) {
    console.error('[DELETE /api/alerts/:id] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
