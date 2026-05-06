const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  attackType: {
    type: String,
    enum: ['SQLi', 'XSS', 'Suspicious'],
    required: true
  },
  payload: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  severity: {
    type: String,
    enum: ['Informational', 'Medium', 'High', 'Critical'],
    required: true
  },
  mlConfidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);