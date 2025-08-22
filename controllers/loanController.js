const Loan = require('../models/Loan');

// Request loan (staff only)
exports.requestLoan = async (req, res) => {
  const { amount, reason } = req.body;
  try {
    const loan = new Loan({ user: req.user.id, amount, reason });
    await loan.save();
    res.json({ msg: 'Loan requested' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Approve/Reject loan (admin only)
exports.updateLoan = async (req, res) => {
  const { status } = req.body;
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ msg: 'Loan not found' });
    loan.status = status;
    await loan.save();
    res.json({ msg: `Loan ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get loans (admin or self)
exports.getLoans = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const loans = await Loan.find(query).populate('user', 'name');
    res.json(loans);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};