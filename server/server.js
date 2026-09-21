const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { startPolling } = require('./jobs/pollFees');
const { computeFeePercentile } = require('./helpers/feeHelper');
const { SUPPORTED_CHAINS } = require('./services/etherscan');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const { lastLabelByChain } = require('./state/labelState');

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

  // Generate mock data for ALL supported chains
  const chainConfigs = {
    ethereum: { base: 18, multiplier: 1 },
    polygon:  { base: 30, multiplier: 1 },
    arbitrum: { base: 0.1, multiplier: 1 },
    base:     { base: 0.05, multiplier: 1 },
  };

  for (const [chain, config] of Object.entries(chainConfigs)) {
    let base = config.base;
    for (let i = totalPoints; i >= 0; i--) {
      const timestamp = new Date(now - i * intervalMs);
      const sine = Math.sin((i / totalPoints) * Math.PI * 4) * (base * 0.3);
      const noise = (Math.random() - 0.48) * (base * 0.2);
      const proposeGwei = Math.max(base * 0.3, Math.round((base + sine + noise) * 1000) / 1000);
      const safeGwei    = Math.max(base * 0.2, Math.round(proposeGwei * 0.85 * 1000) / 1000);
      const fastGwei    = Math.round(proposeGwei * 1.25 * 1000) / 1000;
      result.push({
        _id: `mock-${chain}-${i}`,
        timestamp,
        chain,
        safeGwei,
        proposeGwei,
        fastGwei,
      });
    }
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
    console.log(`[mock] Generated ${memFeeHistory.length} in-memory fee records across ${Object.keys(SUPPORTED_CHAINS).length} chains.`);
    // Start a simple mock cron that emits Socket.io events every 20 seconds
    startMockPolling();
  });

// ─── Mock Polling (offline mode) ─────────────────────────────────────────────
function startMockPolling() {
  const cron = require('node-cron');
  cron.schedule('*/20 * * * * *', () => {
    // Generate mock data for all chains
    for (const chain of Object.keys(SUPPORTED_CHAINS)) {
      const chainHistory = memFeeHistory.filter(d => d.chain === chain);
      const last = chainHistory[chainHistory.length - 1] || { proposeGwei: 18, safeGwei: 15, fastGwei: 22 };
      const noiseScale = last.proposeGwei < 1 ? 0.02 : 3;
      const noise = (Math.random() - 0.48) * noiseScale;
      const proposeGwei = Math.max(last.proposeGwei * 0.3, Math.round((last.proposeGwei + noise) * 1000) / 1000);
      const safeGwei    = Math.max(proposeGwei * 0.5, Math.round(proposeGwei * 0.85 * 1000) / 1000);
      const fastGwei    = Math.round(proposeGwei * 1.25 * 1000) / 1000;

      const doc = {
        _id: `mock-live-${chain}-${Date.now()}`,
        timestamp: new Date(),
        chain,
        safeGwei,
        proposeGwei,
        fastGwei,
      };

      memFeeHistory.push(doc);

      const { percentile, label } = computeFeePercentile(
        doc,
        chainHistory,
        lastLabelByChain[chain]
      );
      lastLabelByChain[chain] = label;
      
      const payload = { ...doc, percentile, label };

      io.emit('feeUpdate', payload);

      // Check in-memory alerts for this chain
      const triggered = memAlerts.filter(
        (a) => !a.triggered && a.chain === chain && a.thresholdGwei >= proposeGwei
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
        console.log(`[mock-poll] 🔔 Alert triggered — ${chain} threshold ${a.thresholdGwei} Gwei`);
      });
    }

    // Keep last 72 hours max per chain
    if (memFeeHistory.length > 144 * Object.keys(SUPPORTED_CHAINS).length) {
      memFeeHistory = memFeeHistory.slice(-144 * Object.keys(SUPPORTED_CHAINS).length);
    }
  });
  console.log('[mock-poll] Mock cron started — emitting feeUpdate for all chains every 20 seconds.');
}

// ─── Helper: validate chain param ─────────────────────────────────────────────
function validateChain(chainParam) {
  const chain = chainParam || 'ethereum';
  if (!SUPPORTED_CHAINS[chain]) return null;
  return chain;
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'DeFi Fee & Timing Predictor Backend is running.',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'offline (demo mode)',
    supportedChains: Object.keys(SUPPORTED_CHAINS),
  });
});

// ─── Fee API — current (with ?chain= filter) ─────────────────────────────────
app.get('/api/fees/current', async (req, res) => {
  try {
    const chain = validateChain(req.query.chain);
    if (!chain) return res.status(400).json({ error: `Unrecognized chain. Supported: ${Object.keys(SUPPORTED_CHAINS).join(', ')}` });

    if (!dbReady) {
      const chainHistory = memFeeHistory.filter(d => d.chain === chain);
      const latest = chainHistory[chainHistory.length - 1];
      if (!latest) return res.status(404).json({ error: 'No data yet.' });
      const { percentile, label } = computeFeePercentile(latest, chainHistory, lastLabelByChain[chain]);
      return res.status(200).json({ ...latest, percentile, label });
    }

    const FeeHistory = require('./models/FeeHistory');
    const latest = await FeeHistory.findOne({ chain }).sort({ timestamp: -1 }).lean();
    if (!latest) return res.status(404).json({ error: 'No fee data available yet.' });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history24h = await FeeHistory.find(
      { chain, timestamp: { $gte: twentyFourHoursAgo } },
      { proposeGwei: 1, _id: 0 }
    ).lean();
    const { percentile, label } = computeFeePercentile(latest, history24h, lastLabelByChain[chain]);
    return res.status(200).json({ ...latest, percentile, label });
  } catch (err) {
    console.error('[/api/fees/current] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Fee API — history (with ?chain= filter) ─────────────────────────────────
app.get('/api/fees/history', async (req, res) => {
  try {
    const chain = validateChain(req.query.chain);
    if (!chain) return res.status(400).json({ error: `Unrecognized chain. Supported: ${Object.keys(SUPPORTED_CHAINS).join(', ')}` });

    const hours = Math.min(168, Math.max(1, parseInt(req.query.hours, 10) || 24));
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    if (!dbReady) {
      const filtered = memFeeHistory.filter((d) => d.chain === chain && new Date(d.timestamp) >= since);
      return res.status(200).json(filtered);
    }

    const FeeHistory = require('./models/FeeHistory');
    const history = await FeeHistory.find({ chain, timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .lean();
    return res.status(200).json(history);
  } catch (err) {
    console.error('[/api/fees/history] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Fee API — compare (all chains at once) ──────────────────────────────────
app.get('/api/fees/compare', async (req, res) => {
  try {
    const chainSlugs = Object.keys(SUPPORTED_CHAINS);
    const results = [];

    if (!dbReady) {
      for (const chain of chainSlugs) {
        const chainHistory = memFeeHistory.filter(d => d.chain === chain);
        const latest = chainHistory[chainHistory.length - 1];
        if (!latest) continue;
        const { percentile, label } = computeFeePercentile(latest, chainHistory, lastLabelByChain[chain]);
        results.push({ ...latest, percentile, label });
      }
      return res.status(200).json(results);
    }

    const FeeHistory = require('./models/FeeHistory');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const chain of chainSlugs) {
      const latest = await FeeHistory.findOne({ chain }).sort({ timestamp: -1 }).lean();
      if (!latest) continue;

      const history24h = await FeeHistory.find(
        { chain, timestamp: { $gte: twentyFourHoursAgo } },
        { proposeGwei: 1, _id: 0 }
      ).lean();

      const { percentile, label } = computeFeePercentile(latest, history24h, lastLabelByChain[chain]);
      results.push({ ...latest, percentile, label });
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error('[/api/fees/compare] Error:', err.message);
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

    // Validate chain against SUPPORTED_CHAINS
    const validatedChain = chain || 'ethereum';
    if (!SUPPORTED_CHAINS[validatedChain]) {
      return res.status(400).json({ error: `Unrecognized chain "${chain}". Supported: ${Object.keys(SUPPORTED_CHAINS).join(', ')}` });
    }

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
      // Check against the latest fee for the specific chain
      const chainHistory = memFeeHistory.filter(d => d.chain === validatedChain);
      const latestMem = chainHistory[chainHistory.length - 1];
      const isMemTriggered = latestMem && latestMem.proposeGwei <= thresholdGwei;
      const newAlert = {
        _id: `mem-alert-${Date.now()}`,
        userId,
        chain: validatedChain,
        thresholdGwei,
        createdAt: new Date(),
        triggered: isMemTriggered || false,
      };
      memAlerts.push(newAlert);
      console.log(`[alerts] ✅ In-memory alert created — ${newAlert.chain} ≤ ${thresholdGwei} Gwei (user: ${userId})`);

      if (isMemTriggered) {
        const { sendGasAlertEmail } = require('./helpers/emailHelper');
        // Look up registered user email
        const User = require('./models/User');
        User.findById(userId).lean().then((u) => {
          if (u && u.email) {
            sendGasAlertEmail(u.email, {
              chain: newAlert.chain,
              thresholdGwei: newAlert.thresholdGwei,
              currentGwei: latestMem.proposeGwei,
            });
          }
        }).catch(() => {});
        io.emit('alertTriggered', {
          alertId: newAlert._id,
          chain: newAlert.chain,
          thresholdGwei: newAlert.thresholdGwei,
          currentGwei: latestMem.proposeGwei,
          triggeredAt: new Date().toISOString(),
        });
      }

      return res.status(201).json(newAlert);
    }

    const UserAlert = require('./models/UserAlert');
    const FeeHistory = require('./models/FeeHistory');
    const User = require('./models/User');
    const { sendGasAlertEmail } = require('./helpers/emailHelper');

    // Check against the latest fee for the specific chain
    const latestFee = await FeeHistory.findOne({ chain: validatedChain }).sort({ timestamp: -1 }).lean();
    const isTriggered = latestFee && latestFee.proposeGwei <= thresholdGwei;

    const alert = await UserAlert.create({
      userId,
      chain: validatedChain,
      thresholdGwei,
      triggered: isTriggered || false,
    });
    console.log(`[alerts] ✅ Alert created — chain: ${alert.chain}, threshold: ${alert.thresholdGwei} Gwei (user: ${userId})`);

    if (isTriggered) {
      const user = await User.findById(userId).lean();
      if (user && user.email) {
        sendGasAlertEmail(user.email, {
          chain: alert.chain,
          thresholdGwei: alert.thresholdGwei,
          currentGwei: latestFee.proposeGwei,
        }).catch((e) => console.error('[POST /api/alerts] Email send error:', e.message));
      }
      io.emit('alertTriggered', {
        alertId: alert._id,
        chain: alert.chain,
        thresholdGwei: alert.thresholdGwei,
        currentGwei: latestFee.proposeGwei,
        triggeredAt: new Date().toISOString(),
      });
    }

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
