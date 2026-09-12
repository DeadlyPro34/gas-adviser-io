const cron = require('node-cron');
const { fetchGasPrices, SUPPORTED_CHAINS } = require('../services/etherscan');
const FeeHistory = require('../models/FeeHistory');
const { computeFeePercentile } = require('../helpers/feeHelper');
const { checkAndTriggerAlerts } = require('../helpers/alertHelper');
const { lastLabelByChain } = require('../state/labelState');

/**
 * Small helper: sleep for `ms` milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Starts a cron job that polls gas prices every 20 seconds
 * for ALL supported chains, persists each reading to MongoDB,
 * emits a "feeUpdate" Socket.io event, and checks untriggered alerts.
 *
 * @param {import('socket.io').Server} io  The Socket.io server instance.
 */
function startPolling(io) {
  const runPollCycle = async () => {
    const chainSlugs = Object.keys(SUPPORTED_CHAINS);

    for (const chainSlug of chainSlugs) {
      try {
        const prices = await fetchGasPrices(chainSlug);

        if (!prices) {
          // fetchGasPrices already logged the reason — just skip this chain
          continue;
        }

        const doc = await FeeHistory.create({
          timestamp: new Date(),
          chain: chainSlug,
          safeGwei: prices.safeGwei,
          proposeGwei: prices.proposeGwei,
          fastGwei: prices.fastGwei,
        });

        console.log(
          `[pollFees] [${chainSlug}] Saved — Safe: ${doc.safeGwei} | Propose: ${doc.proposeGwei} | Fast: ${doc.fastGwei} gwei`
        );

        // Compute percentile against THIS chain's own 24h history only
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const history24h = await FeeHistory.find(
          { chain: chainSlug, timestamp: { $gte: twentyFourHoursAgo } },
          { proposeGwei: 1, _id: 0 }
        ).lean();

        const { percentile, label } = computeFeePercentile(
          doc,
          history24h,
          lastLabelByChain[chainSlug]
        );

        lastLabelByChain[chainSlug] = label;

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
        console.log(`[pollFees] [${chainSlug}] 📡 Emitted feeUpdate — label: ${label} (${percentile}th percentile)`);

        // Check and trigger alerts for this chain
        const triggeredCount = await checkAndTriggerAlerts(doc, io);
        if (triggeredCount > 0) {
          console.log(`[pollFees] [${chainSlug}] 🔔 ${triggeredCount} alert(s) triggered this cycle.`);
        }
      } catch (err) {
        console.error(`[pollFees] [${chainSlug}] Error during poll cycle:`, err.message);
      }

      // 300ms delay between chains to avoid hammering Etherscan
      await sleep(300);
    }
  };

  // Immediate poll on server start
  runPollCycle();

  // node-cron supports seconds when using 6-field expressions
  // "*/20 * * * * *" = every 20 seconds
  const task = cron.schedule('*/20 * * * * *', runPollCycle);

  console.log(`[pollFees] Cron job started — polling ${Object.keys(SUPPORTED_CHAINS).length} chains every 20 seconds.`);
  return task;
}

module.exports = { startPolling };
