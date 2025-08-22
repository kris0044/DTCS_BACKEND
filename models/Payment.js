const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },  // Should be 600
  month: { type: String, required: true },   // e.g., '2025-08'
  date: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Payment', paymentSchema);