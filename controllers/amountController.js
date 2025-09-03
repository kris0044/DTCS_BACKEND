const Amount = require('../models/Amount');

// Get all amounts (admin only)
exports.getAmounts = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Amounts: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Get Amounts: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const amounts = await Amount.find().sort({ effectiveDate: -1 });
    console.log('Fetched amounts:', amounts);
    res.json(amounts);
  } catch (err) {
    console.error('Get Amounts Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get current amount (staff or admin)
exports.getCurrentAmount = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Current Amount: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const currentDate = new Date();
    const amount = await Amount.findOne({ effectiveDate: { $lte: currentDate } })
      .sort({ effectiveDate: -1 });
    const currentAmount = amount ? amount.amount : 600;
    console.log('Fetched current amount:', currentAmount);
    res.json({ amount: currentAmount });
  } catch (err) {
    console.error('Get Current Amount Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Add new amount (admin only)
exports.addAmount = async (req, res) => {
  const { amount, effectiveDate } = req.body;
  try {
    if (!req.user) {
      console.error('Add Amount: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (!amount || !effectiveDate) {
      return res.status(400).json({ msg: 'Amount and effective date are required' });
    }
    if (amount <= 0) {
      return res.status(400).json({ msg: 'Amount must be positive' });
    }
    const newAmount = new Amount({ amount, effectiveDate });
    await newAmount.save();
    console.log('Added amount:', newAmount);
    res.json({ msg: 'Amount added', amount: newAmount });
  } catch (err) {
    console.error('Add Amount Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update amount (admin only)
exports.updateAmount = async (req, res) => {
  const { amount, effectiveDate } = req.body;
  try {
    if (!req.user) {
      console.error('Update Amount: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const amountRecord = await Amount.findById(req.params.id);
    if (!amountRecord) {
      return res.status(404).json({ msg: 'Amount not found' });
    }
    if (amount <= 0) {
      return res.status(400).json({ msg: 'Amount must be positive' });
    }
    amountRecord.amount = amount || amountRecord.amount;
    amountRecord.effectiveDate = effectiveDate || amountRecord.effectiveDate;
    await amountRecord.save();
    console.log('Updated amount:', amountRecord);
    res.json({ msg: 'Amount updated', amount: amountRecord });
  } catch (err) {
    console.error('Update Amount Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete amount (admin only)
exports.deleteAmount = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Delete Amount: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const amount = await Amount.findById(req.params.id);
    if (!amount) {
      return res.status(404).json({ msg: 'Amount not found' });
    }
    await amount.deleteOne();
    console.log('Deleted amount:', amount);
    res.json({ msg: 'Amount deleted' });
  } catch (err) {
    console.error('Delete Amount Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// For internal use (payment validation)
exports.getCurrentAmountInternal = async () => {
  try {
    const currentDate = new Date();
    const amount = await Amount.findOne({ effectiveDate: { $lte: currentDate } })
      .sort({ effectiveDate: -1 });
    console.log('Current amount (internal):', amount ? amount.amount : 600);
    return amount ? amount.amount : 600;
  } catch (err) {
    console.error('Get Current Amount Internal Error:', err.stack);
    return 600;
  }
};