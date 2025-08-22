const Payment = require('../models/Payment');

// Make payment (staff only)
exports.makePayment = async (req, res) => {
  const { amount, month } = req.body;
  if (amount !== 600) return res.status(400).json({ msg: 'Amount must be 600' });
  try {
    const payment = new Payment({ user: req.user.id, amount, month });
    await payment.save();
    res.json({ msg: 'Payment recorded' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get payments (admin or self)
exports.getPayments = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const payments = await Payment.find(query).populate('user', 'name');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};