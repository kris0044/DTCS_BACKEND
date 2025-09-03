const Payment = require('../models/Payment');
const { getCurrentAmountInternal } = require('./amountController');

// Make payment (staff only)
exports.makePayment = async (req, res) => {
  const { amount, month } = req.body;
  try {
    if (!req.user) {
      console.error('Make Payment: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'staff') {
      console.log(`Make Payment: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Staff access required' });
    }
    if (!amount || !month) {
      return res.status(400).json({ msg: 'Amount and month are required' });
    }
    const currentAmount = await getCurrentAmountInternal();
    if (amount !== currentAmount) {
      return res.status(400).json({ msg: `Amount must be ₹${currentAmount}` });
    }
    const payment = new Payment({ user: req.user.id, amount, month });
    await payment.save();
    console.log('Payment recorded:', payment);
    res.json({ msg: 'Payment recorded', payment });
  } catch (err) {
    console.error('Make Payment Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get payments (admin or self)
exports.getPayments = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Payments: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const payments = await Payment.find(query)
      .populate('user', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });
    const total = await Payment.countDocuments(query);
    console.log('Fetched payments:', payments);
    res.json({ payments, total });
  } catch (err) {
    console.error('Get Payments Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update payment (admin only)
exports.updatePayment = async (req, res) => {
  const { amount, month } = req.body;
  try {
    if (!req.user) {
      console.error('Update Payment: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Update Payment: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const currentAmount = await getCurrentAmountInternal();
    if (amount !== currentAmount) {
      return res.status(400).json({ msg: `Amount must be ₹${currentAmount}` });
    }
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    payment.amount = amount;
    payment.month = month;
    await payment.save();
    console.log('Updated payment:', payment);
    res.json({ msg: 'Payment updated', payment });
  } catch (err) {
    console.error('Update Payment Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete payment (admin only)
exports.deletePayment = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Delete Payment: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Delete Payment: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    await payment.deleteOne();
    console.log('Deleted payment:', payment);
    res.json({ msg: 'Payment deleted' });
  } catch (err) {
    console.error('Delete Payment Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};