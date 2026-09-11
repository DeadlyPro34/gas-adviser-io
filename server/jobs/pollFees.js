const cron = require('node-cron');
const { fetchGasPrices } = require('../services/etherscan');
const FeeHistory = require('../models/FeeHistory');

/**
 * Starts a cron job that polls gas prices every 20 seconds
 * and persists each reading to MongoDB.
 */
function startPolling() {
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
    } catch (err) {
      console.error('[pollFees] Error during poll cycle:', err.message);
    }
  });

  console.log('[pollFees] Cron job started — polling every 20 seconds.');
  return task;
}

module.exports = { startPolling };
