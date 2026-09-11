const axios = require('axios');

const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';

/**
 * Fetches current gas prices from the Etherscan Gas Oracle endpoint.
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
      safeGwei: parseFloat(SafeGasPrice),
      proposeGwei: parseFloat(ProposeGasPrice),
      fastGwei: parseFloat(FastGasPrice),
    };
  } catch (err) {
    console.error('[etherscan] Failed to fetch gas prices:', err.message);
    return null;
  }
}

module.exports = { fetchGasPrices };
