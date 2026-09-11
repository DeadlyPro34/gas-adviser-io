const axios = require('axios');

// Etherscan API V2 base URL (V1 is deprecated)
const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';

/**
 * Format Gwei values to clean numeric representation:
 * If < 1 Gwei, keep 2-3 decimal places (e.g. 0.06); if >= 1 Gwei, keep 1 decimal place (e.g. 18.2)
 */
function cleanGwei(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return 0;
  return num < 1 ? Number(num.toFixed(3)) : Number(num.toFixed(1));
}

/**
 * Fetches current gas prices from the Etherscan Gas Oracle V2 endpoint.
 * @returns {{ safeGwei: number, proposeGwei: number, fastGwei: number } | null}
 *   Parsed gwei values, or null if the request failed.
 */
async function fetchGasPrices() {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey || apiKey === 'YOUR_ETHERSCAN_API_KEY') {
      console.warn('[etherscan] ETHERSCAN_API_KEY is not configured — skipping fetch.');
      return null;
    }

    const response = await axios.get(ETHERSCAN_API_URL, {
      params: {
        chainid: 1, // Ethereum Mainnet
        module: 'gastracker',
        action: 'gasoracle',
        apikey: apiKey,
      },
      timeout: 10000, // 10-second timeout
    });

    const { data } = response;

    if (data.status !== '1' || !data.result) {
      console.warn('[etherscan] Unexpected API response:', data.message || data);
      return null;
    }

    const { SafeGasPrice, ProposeGasPrice, FastGasPrice } = data.result;

    return {
      safeGwei: cleanGwei(SafeGasPrice),
      proposeGwei: cleanGwei(ProposeGasPrice),
      fastGwei: cleanGwei(FastGasPrice),
    };
  } catch (err) {
    console.error('[etherscan] Failed to fetch gas prices:', err.message);
    return null;
  }
}

module.exports = { fetchGasPrices, cleanGwei };
