const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Amount = require('../models/Amount');
const Notice = require('../models/Notice');
const Meeting = require('../models/Meeting');
const Payment = require('../models/Payment');
const Loan = require('../models/Loan');
const User = require('../models/users');
const Balance = require('../models/BalanceEntry');
const Resignation = require('../models/Resignation');
const authMiddleware = require('../middleware/auth');

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

    // Initialize counts object
    const counts = {
      completedLoans: 0,
      pendingLoans: 0,
      ongoingLoans: 0,
      rejectedLoans: 0,
      totalUsers: 0,
      totalMeetings: 0,
      totalNotices: 0,
      totalBalance: 0,
      totalResignations: 0,
      totalPayments: 0,
    };

    // Fetch counts based on user role
    if (user.role === 'staff') {
      // User-specific counts
      counts.completedLoans = await Loan.countDocuments({ user: user.id, status: 'completed' });
      counts.pendingLoans = await Loan.countDocuments({ user: user.id, status: 'pending' });
      counts.ongoingLoans = await Loan.countDocuments({ user: user.id, status: 'approved' });
      counts.rejectedLoans = await Loan.countDocuments({ user: user.id, status: 'rejected' });
      counts.totalResignations = await Resignation.countDocuments({ user: user.id });

      // User-specific total payments
      const userPaymentsAgg = await Payment.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(user.id) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      counts.totalPayments = userPaymentsAgg.length > 0 ? Number(userPaymentsAgg[0].total.toFixed(2)) : 0;
    } else if (user.role === 'admin') {
      // Global counts
      counts.completedLoans = await Loan.countDocuments({ status: 'completed' });
      counts.pendingLoans = await Loan.countDocuments({ status: 'pending' });
      counts.ongoingLoans = await Loan.countDocuments({ status: 'approved' });
      counts.rejectedLoans = await Loan.countDocuments({ status: 'rejected' });
      counts.totalUsers = await User.countDocuments();
      counts.totalMeetings = await Meeting.countDocuments();
      counts.totalNotices = await Notice.countDocuments();
      counts.totalResignations = await Resignation.countDocuments();

      // Global total balance
      const totalBalanceAgg = await Balance.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      counts.totalBalance = totalBalanceAgg.length > 0 ? Number(totalBalanceAgg[0].total.toFixed(2)) : 0;

      // Global total payments
      const totalPaymentsAgg = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      counts.totalPayments = totalPaymentsAgg.length > 0 ? Number(totalPaymentsAgg[0].total.toFixed(2)) : 0;
    }

    // Fetch payment summary (user-specific for staff, global for admin)
    const paymentSummary = await Payment.aggregate([
      ...(user.role === 'staff' ? [{ $match: { user: new mongoose.Types.ObjectId(user.id) } }] : []),
      {
        $group: {
          _id: '$month',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fetch loan summary (user-specific for staff, global for admin)
    const loanSummary = await Loan.aggregate([
      ...(user.role === 'staff' ? [{ $match: { user: new mongoose.Types.ObjectId(user.id) } }] : []),
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

    // Fetch user-specific data for staff, global for admin
    let userPayments = [];
    let userLoans = [];
    if (user.role === 'staff') {
      userPayments = await Payment.find({ user: user.id }).sort({ month: -1 }).limit(10);
      userLoans = await Loan.find({ user: user.id }).sort({ date: -1 }).limit(10);
    } else if (user.role === 'admin') {
      userPayments = await Payment.find().sort({ month: -1 }).limit(10);
      userLoans = await Loan.find().sort({ date: -1 }).limit(10);
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
      counts,
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;