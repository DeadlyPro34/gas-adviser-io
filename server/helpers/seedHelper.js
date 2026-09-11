const FeeHistory = require('../models/FeeHistory');

/**
 * Seeds initial historical fee readings if fewer than 10 records exist in MongoDB.
 * Generates realistic gas price trends for the last 24 hours.
 */
async function seedInitialDataIfNeeded() {
  try {
    const count = await FeeHistory.countDocuments();
    if (count >= 10) {
      console.log(`[seeder] DB already has ${count} fee readings — skipping initial seed.`);
      return;
    }

    console.log('[seeder] DB has few records — generating 24h mock historical gas readings...');

    const now = Date.now();
    const totalPoints = 48; // one reading every 30 minutes for 24 hours
    const intervalMs = (24 * 60 * 60 * 1000) / totalPoints;
    const seedDocs = [];

    // Base gas prices around realistic Ethereum mainnet levels (0.045 - 0.085 Gwei)
    let basePropose = 0.062;

    for (let i = totalPoints; i >= 0; i--) {
      const timestamp = new Date(now - i * intervalMs);
      
      // Simulate organic gas price fluctuations with sinus wave + random noise
      const sineVariation = Math.sin((i / totalPoints) * Math.PI * 4) * 0.012;
      const randomNoise = (Math.random() - 0.48) * 0.008;
      
      const proposeGwei = Math.max(0.045, Math.round((basePropose + sineVariation + randomNoise) * 1000) / 1000);
      const safeGwei = Math.max(0.040, Math.round((proposeGwei * 0.9) * 1000) / 1000);
      const fastGwei = Math.round((proposeGwei * 1.15) * 1000) / 1000;

      seedDocs.push({
        timestamp,
        chain: 'ethereum',
        safeGwei,
        proposeGwei,
        fastGwei,
      });
    }

    await FeeHistory.insertMany(seedDocs);
    console.log(`[seeder] ✅ Successfully seeded ${seedDocs.length} historical fee records.`);
  } catch (err) {
    console.error('[seeder] Failed to seed initial data:', err.message);
  }
}

module.exports = { seedInitialDataIfNeeded };
