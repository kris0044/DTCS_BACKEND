const Loan = require('../models/Loan');

// Request loan (staff only)
exports.requestLoan = async (req, res) => {
  const { amount, reason } = req.body;
  try {
    if (!req.user) {
      console.error('Request Loan: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'staff') {
      console.log(`Request Loan: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Staff access required' });
    }
    if (!amount || !reason) {
      return res.status(400).json({ msg: 'Amount and reason are required' });
    }
    if (amount <= 0) {
      return res.status(400).json({ msg: 'Amount must be positive' });
    }
    const loan = new Loan({ user: req.user.id, amount, reason });
    await loan.save();
    console.log('Loan requested:', loan);
    res.json({ msg: 'Loan requested', loan });
  } catch (err) {
    console.error('Request Loan Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Approve/Reject loan (admin only)
exports.updateLoan = async (req, res) => {
  const { status } = req.body;
  try {
    if (!req.user) {
      console.error('Update Loan: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Update Loan: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ msg: 'Loan not found' });
    }
    loan.status = status;
    await loan.save();
    console.log(`Loan ${status}:`, loan);
    res.json({ msg: `Loan ${status}`, loan });
  } catch (err) {
    console.error('Update Loan Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete loan (admin only)
exports.deleteLoan = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Delete Loan: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Delete Loan: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ msg: 'Loan not found' });
    }
    await loan.deleteOne();
    console.log('Deleted loan:', loan);
    res.json({ msg: 'Loan deleted' });
  } catch (err) {
    console.error('Delete Loan Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get loans (admin or self)
exports.getLoans = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Loans: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const loans = await Loan.find(query)
      .populate('user', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });
    const total = await Loan.countDocuments(query);
    console.log('Fetched loans:', loans);
    res.json({ loans, total });
  } catch (err) {
    console.error('Get Loans Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};