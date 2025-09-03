const mongoose = require('mongoose');

const interestRateSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative'],
  },
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('InterestRate', interestRateSchema);