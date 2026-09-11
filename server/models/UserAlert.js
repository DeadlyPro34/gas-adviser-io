const mongoose = require('mongoose');

const userAlertSchema = new mongoose.Schema({
  chain: {
    type: String,
    default: 'ethereum',
    required: true,
  },
  thresholdGwei: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  triggered: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('UserAlert', userAlertSchema);
