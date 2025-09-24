// models/Loan.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
});

const loanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected','completed'], default: 'pending' },
  date: { type: Date, default: Date.now },
  interestRate: { type: Number, required: false }, // Annual interest rate (e.g., 5 for 5%)
  duration: { type: Number, required: false }, // Duration in months
  totalAmountPayable: { type: Number, required: false }, // Total amount including interest
  emiAmount: { type: Number, required: false }, // Monthly EMI amount
  payments: [paymentSchema], // Array to track EMI payments
});

module.exports = mongoose.model('Loan', loanSchema);