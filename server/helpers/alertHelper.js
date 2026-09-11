const UserAlert = require('../models/UserAlert');
const User = require('../models/User');
const { sendGasAlertEmail } = require('./emailHelper');

/**
 * Checks all untriggered alerts against the latest fee reading.
 * If the current fee (proposeGwei) is at or below an alert's threshold,
 * the alert is marked as triggered and an "alertTriggered" Socket.io
 * event is emitted with the alert details, plus a notification email is sent.
 *
 * @param {{ chain: string, proposeGwei: number }} feeDoc  The latest fee reading.
 * @param {import('socket.io').Server} io  The Socket.io server instance.
 * @returns {Promise<number>} The number of alerts that were triggered.
 */
async function checkAndTriggerAlerts(feeDoc, io) {
  try {
    // Find all untriggered alerts for this chain where the threshold
    // is >= the current fee (meaning the fee has dropped to an acceptable level)
    const matchingAlerts = await UserAlert.find({
      chain: feeDoc.chain,
      triggered: false,
      thresholdGwei: { $gte: feeDoc.proposeGwei },
    });

    if (matchingAlerts.length === 0) return 0;

    // Mark each matching alert as triggered, emit event, and send email
    for (const alert of matchingAlerts) {
      alert.triggered = true;
      await alert.save();

      const payload = {
        alertId: alert._id,
        chain: alert.chain,
        thresholdGwei: alert.thresholdGwei,
        currentGwei: feeDoc.proposeGwei,
        triggeredAt: new Date().toISOString(),
      };

      if (io) {
        io.emit('alertTriggered', payload);
      }

      console.log(
        `[alertHelper] 🔔 Alert triggered — threshold: ${alert.thresholdGwei} gwei, current: ${feeDoc.proposeGwei} gwei (user: ${alert.userId})`
      );

      // Send real email notification to user
      try {
        if (alert.userId) {
          const user = await User.findById(alert.userId).lean();
          if (user && user.email) {
            sendGasAlertEmail(user.email, {
              chain: alert.chain,
              thresholdGwei: alert.thresholdGwei,
              currentGwei: feeDoc.proposeGwei,
            }).catch((e) => console.error('[alertHelper] Email send error:', e.message));
          }
        }
      } catch (emailErr) {
        console.error('[alertHelper] Could not find user to send email:', emailErr.message);
      }
    }

    return matchingAlerts.length;
  } catch (err) {
    console.error('[alertHelper] Error checking alerts:', err.message);
    return 0;
  }
}

module.exports = { checkAndTriggerAlerts };
