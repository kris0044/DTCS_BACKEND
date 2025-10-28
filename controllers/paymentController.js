const Payment = require('../models/Payment');
const Balance = require('../models/BalanceEntry');
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

    // Add payment amount to balance
    const balanceEntry = new Balance({
      amount: amount,
      note: `Payment recorded for user ${req.user.id} for ${month} (Payment ID: ${payment._id})`
    });
    await balanceEntry.save();
    console.log('Balance updated for payment:', balanceEntry);

    // Calculate total balance
    const totalBalance = await Balance.find().then(entries => 
      entries.reduce((sum, entry) => sum + entry.amount, 0)
    );

    console.log('Payment recorded:', payment);
    res.json({ 
      msg: 'Payment recorded', 
      payment, 
      totalBalance: Number(totalBalance.toFixed(2)) 
    });
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
    const oldAmount = payment.amount;
    payment.amount = amount;
    payment.month = month;
    await payment.save();

    // Update balance if amount has changed
    if (oldAmount !== amount) {
      const balanceAdjustment = amount - oldAmount;
      const balanceEntry = new Balance({
        amount: balanceAdjustment,
        note: `Payment update adjustment for Payment ID: ${payment._id} (user: ${payment.user}, month: ${month})`
      });
      await balanceEntry.save();
      console.log('Balance adjusted for payment update:', balanceEntry);
    }

    // Calculate total balance
    const totalBalance = await Balance.find().then(entries => 
      entries.reduce((sum, entry) => sum + entry.amount, 0)
    );

    console.log('Updated payment:', payment);
    res.json({ 
      msg: 'Payment updated', 
      payment, 
      totalBalance: Number(totalBalance.toFixed(2)) 
    });
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
    // Deduct payment amount from balance
    const balanceEntry = new Balance({
      amount: -payment.amount,
      note: `Payment deleted for Payment ID: ${payment._id} (user: ${payment.user}, month: ${payment.month})`
    });
    await balanceEntry.save();
    console.log('Balance adjusted for payment deletion:', balanceEntry);

    await payment.deleteOne();

    // Calculate total balance
    const totalBalance = await Balance.find().then(entries => 
      entries.reduce((sum, entry) => sum + entry.amount, 0)
    );

    console.log('Deleted payment:', payment);
    res.json({ 
      msg: 'Payment deleted', 
      totalBalance: Number(totalBalance.toFixed(2)) 
    });
  } catch (err) {
    console.error('Delete Payment Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};