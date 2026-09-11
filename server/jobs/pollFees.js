const cron = require('node-cron');
const { fetchGasPrices } = require('../services/etherscan');
const FeeHistory = require('../models/FeeHistory');
const { computeFeePercentile } = require('../helpers/feeHelper');

/**
 * Starts a cron job that polls gas prices every 20 seconds,
 * persists each reading to MongoDB, emits a "feeUpdate" Socket.io
 * event.
 *
 * @param {import('socket.io').Server} io  The Socket.io server instance.
 */
function startPolling(io) {
  // node-cron supports seconds when using 6-field expressions
  // "*/20 * * * * *" = every 20 seconds
  const task = cron.schedule('*/20 * * * * *', async () => {
    try {
      const prices = await fetchGasPrices();

      if (!prices) {
        // fetchGasPrices already logged the reason — just skip this cycle
        return;
      }

      const doc = await FeeHistory.create({
        timestamp: new Date(),
        chain: 'ethereum',
        safeGwei: prices.safeGwei,
        proposeGwei: prices.proposeGwei,
        fastGwei: prices.fastGwei,
      });

      console.log(
        `[pollFees] Saved — Safe: ${doc.safeGwei} | Propose: ${doc.proposeGwei} | Fast: ${doc.fastGwei} gwei`
      );

      // ── Milestone 4: Emit real-time fee update ──────────────────────────
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const history24h = await FeeHistory.find(
        { timestamp: { $gte: twentyFourHoursAgo } },
        { proposeGwei: 1, _id: 0 }
      ).lean();

      const { percentile, label } = computeFeePercentile(doc, history24h);

      const feePayload = {
        _id: doc._id,
        timestamp: doc.timestamp,
        chain: doc.chain,
        safeGwei: doc.safeGwei,
        proposeGwei: doc.proposeGwei,
        fastGwei: doc.fastGwei,
        percentile,
        label,
      };

      io.emit('feeUpdate', feePayload);
      console.log(`[pollFees] 📡 Emitted feeUpdate — label: ${label} (${percentile}th percentile)`);
    } catch (err) {
      console.error('[pollFees] Error during poll cycle:', err.message);
    }
  });

  console.log('[pollFees] Cron job started — polling every 20 seconds.');
  return task;
}

module.exports = { startPolling };
