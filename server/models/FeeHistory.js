const mongoose = require('mongoose');

const feeHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  chain: {
    type: String,
    default: 'ethereum',
  },
  safeGwei: {
    type: Number,
    required: true,
  },
  proposeGwei: {
    type: Number,
    required: true,
  },
  fastGwei: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('FeeHistory', feeHistorySchema);
