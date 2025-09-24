// Model: models/Resignation.js
const mongoose = require('mongoose');

const resignationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  leavingDate: { type: Date, required: true },
  feedback: { type: String, required: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resignation', resignationSchema);