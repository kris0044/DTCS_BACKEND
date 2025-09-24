const Balance = require('../models/BalanceEntry');

// Create balance entry (admin only)
exports.createBalanceEntry = async (req, res) => {
  const { amount, note } = req.body;
  try {
    if (!req.user) {
      console.error('Create Balance Entry: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Create Balance Entry: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (typeof amount !== 'number') {
      return res.status(400).json({ msg: 'Amount must be a number' });
    }
    const entry = new Balance({
      amount,
      note: note || '' // Default to empty string if note is not provided
    });
    await entry.save();
    const totalBalance = await calculateTotalBalance();
    console.log('Balance entry created:', entry);
    res.json({ msg: 'Balance entry created', entry, totalBalance });
  } catch (err) {
    console.error('Create Balance Entry Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update balance entry (admin only)
exports.updateBalanceEntry = async (req, res) => {
  const { amount, note } = req.body;
  const { id } = req.params;
  try {
    if (!req.user) {
      console.error('Update Balance Entry: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Update Balance Entry: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const entry = await Balance.findById(id);
    if (!entry) {
      return res.status(404).json({ msg: 'Balance entry not found' });
    }
    if (amount !== undefined) {
      if (typeof amount !== 'number') {
        return res.status(400).json({ msg: 'Amount must be a number' });
      }
      entry.amount = amount;
    }
    if (note !== undefined) {
      entry.note = note;
    }
    await entry.save();
    const totalBalance = await calculateTotalBalance();
    console.log('Balance entry updated:', entry);
    res.json({ msg: 'Balance entry updated', entry, totalBalance });
  } catch (err) {
    console.error('Update Balance Entry Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete balance entry (admin only)
exports.deleteBalanceEntry = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user) {
      console.error('Delete Balance Entry: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Delete Balance Entry: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const entry = await Balance.findById(id);
    if (!entry) {
      return res.status(404).json({ msg: 'Balance entry not found' });
    }
    await entry.deleteOne();
    const totalBalance = await calculateTotalBalance();
    console.log('Balance entry deleted:', id);
    res.json({ msg: 'Balance entry deleted', totalBalance });
  } catch (err) {
    console.error('Delete Balance Entry Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get all balance entries (admin only)
exports.getBalanceEntries = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Balance Entries: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Get Balance Entries: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const entries = await Balance.find().sort({ date: -1 });
    const totalBalance = await calculateTotalBalance();
    console.log('Fetched balance entries:', entries.length);
    res.json({ entries, totalBalance });
  } catch (err) {
    console.error('Get Balance Entries Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Helper function to calculate total balance
const calculateTotalBalance = async () => {
  const entries = await Balance.find();
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
};