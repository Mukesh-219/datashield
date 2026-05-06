const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  targetUrl: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alertCount: {
    type: Number,
    default: 0
  },
  maxRiskScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Scan', scanSchema);