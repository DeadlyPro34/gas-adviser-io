/**
 * Fee percentile helpers.
 *
 * Given a current gas-price reading and a list of historical readings,
 * these functions compute where the current fee sits as a percentile
 * and map it to a human-readable label: "low" | "normal" | "high".
 */

/**
 * Calculates the percentile rank of `currentValue` within `values`.
 * Uses the "percentage of values that are less than or equal" formula.
 *
 * @param {number}   currentValue     The value to rank.
 * @param {number[]} historicalValues  Array of comparison values.
 * @returns {number} Percentile from 0 to 100 (rounded to 1 decimal).
 */
function calculatePercentile(currentValue, historicalValues) {
  if (!historicalValues || historicalValues.length === 0) {
    return 50; // default to midpoint when no history is available
  }

  const belowOrEqual = historicalValues.filter((v) => v <= currentValue).length;
  const percentile = (belowOrEqual / historicalValues.length) * 100;
  return Math.round(percentile * 10) / 10; // round to 1 decimal place
}

/**
 * Maps a percentile rank to a descriptive label with hysteresis to prevent rapid flapping.
 *
 * @param {number} percentile    Percentile value (0–100).
 * @param {string} previousLabel The label emitted in the last polling cycle.
 * @returns {"low" | "normal" | "high"}
 */
function getPercentileLabel(percentile, previousLabel) {
  // If we have a previous state, use hysteresis bands to leave it
  if (previousLabel === 'low') {
    // Must cross > 38 to leave 'low' and go back to 'normal'
    if (percentile > 38) return percentile > 70 ? 'high' : 'normal';
    return 'low';
  } else if (previousLabel === 'high') {
    // Must fall < 62 to leave 'high' and go back to 'normal'
    if (percentile < 62) return percentile < 30 ? 'low' : 'normal';
    return 'high';
  } else if (previousLabel === 'normal') {
    // Must cross < 30 or > 70 to leave 'normal'
    if (percentile < 30) return 'low';
    if (percentile > 70) return 'high';
    return 'normal';
  }

  // Fallback (e.g. very first reading)
  if (percentile < 33) return 'low';
  if (percentile <= 67) return 'normal';
  return 'high';
}

/**
 * Convenience wrapper: given the current FeeHistory document and a list of
 * 24-hour FeeHistory documents, computes the percentile and label based
 * on `proposeGwei`.
 *
 * @param {{ proposeGwei: number }}   currentDoc  The latest reading.
 * @param {{ proposeGwei: number }[]} history24h  Historical readings.
 * @param {string}                    previousLabel The previous label emitted for this chain.
 * @returns {{ percentile: number, label: "low" | "normal" | "high" }}
 */
function computeFeePercentile(currentDoc, history24h, previousLabel) {
  const historicalValues = history24h.map((d) => d.proposeGwei);
  const percentile = calculatePercentile(currentDoc.proposeGwei, historicalValues);

  // If sample size is too small, percentile is statistically unreliable
  if (historicalValues.length < 10) {
    return { percentile, label: 'normal' };
  }

  const label = getPercentileLabel(percentile, previousLabel);
  return { percentile, label };
}

module.exports = {
  calculatePercentile,
  getPercentileLabel,
  computeFeePercentile,
};
