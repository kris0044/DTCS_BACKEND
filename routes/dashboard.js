const express = require('express');
const router = express.Router();
const Amount = require('../models/Amount');
const Notice = require('../models/Notice');
const Meeting = require('../models/Meeting');
const Payment = require('../models/Payment');
const Loan = require('../models/Loan');
const User = require('../models/users');
const authMiddleware = require('../middleware/auth'); // Verify this path

// Get dashboard data (for both admin and staff)
router.get('/dashboard', authMiddleware.protect, async (req, res) => {
  try {
    const user = req.user; // From authMiddleware (JWT decoded user)

    // Fetch current amount (latest by effectiveDate)
    const currentAmount = await Amount.findOne().sort({ effectiveDate: -1 }).select('amount effectiveDate');

    // Fetch notices (latest 5)
    const notices = await Notice.find().sort({ date: -1 }).limit(5).select('title description date');

    // Fetch meetings (upcoming or latest 5)
    const meetings = await Meeting.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(5)
      .select('title description date time');

    // Fetch payment summary (total payments and monthly breakdown)
    const paymentSummary = await Payment.aggregate([
      {
        $group: {
          _id: '$month',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fetch loan summary (counts and amounts by status)
    const loanSummary = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Fetch pending users (admin only)
    let pendingUsers = [];
    if (user.role === 'admin') {
      pendingUsers = await User.find({ isApproved: false }).select('name email');
    }

    // Fetch user-specific data for staff
    let userPayments = [];
    let userLoans = [];
    if (user.role === 'staff') {
      userPayments = await Payment.find({ user: user.id }).sort({ month: -1 }).limit(10);
      userLoans = await Loan.find({ user: user.id }).sort({ date: -1 }).limit(10);
    }

    res.json({
      currentAmount: currentAmount ? { amount: currentAmount.amount, effectiveDate: currentAmount.effectiveDate } : null,
      notices,
      meetings,
      paymentSummary,
      loanSummary,
      pendingUsers,
      userPayments,
      userLoans,
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;