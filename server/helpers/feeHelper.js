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
 * Maps a percentile rank to a descriptive label.
 *
 * @param {number} percentile  Percentile value (0–100).
 * @returns {"low" | "normal" | "high"}
 */
function getPercentileLabel(percentile) {
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
 * @returns {{ percentile: number, label: "low" | "normal" | "high" }}
 */
function computeFeePercentile(currentDoc, history24h) {
  const historicalValues = history24h.map((d) => d.proposeGwei);
  const percentile = calculatePercentile(currentDoc.proposeGwei, historicalValues);
  const label = getPercentileLabel(percentile);
  return { percentile, label };
}

module.exports = {
  calculatePercentile,
  getPercentileLabel,
  computeFeePercentile,
};
