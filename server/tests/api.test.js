/**
 * Milestone 3 — REST API tests.
 *
 * Uses Node.js built-in test runner (node:test) and assert module.
 * Run with: npm test
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  calculatePercentile,
  getPercentileLabel,
  computeFeePercentile,
} = require('../helpers/feeHelper');

// ─── Unit tests for feeHelper ────────────────────────────────────────────────

describe('calculatePercentile', () => {
  it('returns 50 when there is no historical data', () => {
    assert.equal(calculatePercentile(20, []), 50);
    assert.equal(calculatePercentile(20, null), 50);
  });

  it('returns 100 when current is the highest value', () => {
    assert.equal(calculatePercentile(30, [10, 15, 20, 25]), 100);
  });

  it('returns the correct percentile for the lowest value', () => {
    // 5 is <= only itself → 1/5 = 20%
    assert.equal(calculatePercentile(5, [5, 10, 15, 20, 25]), 20);
  });

  it('returns the correct percentile for a mid-range value', () => {
    // 15 is <= 5, 10, 15 → 3/5 = 60%
    assert.equal(calculatePercentile(15, [5, 10, 15, 20, 25]), 60);
  });

  it('returns 0 when current is below all historical values', () => {
    assert.equal(calculatePercentile(1, [5, 10, 15, 20, 25]), 0);
  });
});

describe('getPercentileLabel', () => {
  it('returns "low" for percentile < 33', () => {
    assert.equal(getPercentileLabel(0), 'low');
    assert.equal(getPercentileLabel(20), 'low');
    assert.equal(getPercentileLabel(32.9), 'low');
  });

  it('returns "normal" for percentile between 33 and 67', () => {
    assert.equal(getPercentileLabel(33), 'normal');
    assert.equal(getPercentileLabel(50), 'normal');
    assert.equal(getPercentileLabel(67), 'normal');
  });

  it('returns "high" for percentile > 67', () => {
    assert.equal(getPercentileLabel(67.1), 'high');
    assert.equal(getPercentileLabel(80), 'high');
    assert.equal(getPercentileLabel(100), 'high');
  });
});

describe('computeFeePercentile', () => {
  it('computes percentile and label from FeeHistory-like objects', () => {
    const current = { proposeGwei: 20 };
    const history = [
      { proposeGwei: 10 },
      { proposeGwei: 15 },
      { proposeGwei: 20 },
      { proposeGwei: 25 },
      { proposeGwei: 30 },
    ];

    const result = computeFeePercentile(current, history);
    // 20 is <= 10(no), 15(no), 20(yes), 25(no), 30(no) — wait:
    // values <= 20 are: 10, 15, 20 → 3/5 = 60%
    assert.equal(result.percentile, 60);
    assert.equal(result.label, 'normal');
  });

  it('returns "low" when current fee is among the cheapest', () => {
    const current = { proposeGwei: 5 };
    const history = [
      { proposeGwei: 5 },
      { proposeGwei: 10 },
      { proposeGwei: 20 },
      { proposeGwei: 30 },
      { proposeGwei: 40 },
      { proposeGwei: 50 },
    ];

    const result = computeFeePercentile(current, history);
    // values <= 5: [5] → 1/6 ≈ 16.7%
    assert.equal(result.percentile, 16.7);
    assert.equal(result.label, 'low');
  });

  it('returns "high" when current fee is among the most expensive', () => {
    const current = { proposeGwei: 100 };
    const history = [
      { proposeGwei: 10 },
      { proposeGwei: 20 },
      { proposeGwei: 30 },
      { proposeGwei: 40 },
    ];

    const result = computeFeePercentile(current, history);
    // 100 is > all → 4/4 = 100%
    assert.equal(result.percentile, 100);
    assert.equal(result.label, 'high');
  });
});
