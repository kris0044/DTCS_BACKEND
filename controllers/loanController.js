const Loan = require('../models/Loan');
const Balance = require('../models/BalanceEntry');

// Calculate EMI using the formula: EMI = [P * R * (1+R)^N] / [(1+R)^N - 1]
const calculateEMI = (principal, annualInterestRate, durationInMonths) => {
  const monthlyRate = annualInterestRate / 100 / 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, durationInMonths)) /
              (Math.pow(1 + monthlyRate, durationInMonths) - 1);
  return emi;
};

// Request loan (staff only)
exports.requestLoan = async (req, res) => {
  const { amount, reason, interestRate, duration } = req.body;
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
    const loan = new Loan({
      user: req.user.id,
      amount,
      reason,
    });

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
  let { status, interestRate, duration, emiStartDate } = req.body;
  try {
    if (!req.user) {
      console.error('Update Loan: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Update Loan: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    console.log('Update Loan Request Body:', { status, interestRate, duration, emiStartDate });
    if (typeof status === 'object' && status !== null && typeof status.status === 'string') {
      interestRate = status.interestRate || interestRate;
      duration = status.duration || duration;
      emiStartDate = status.emiStartDate || emiStartDate;
      status = status.status;
      console.log('Extracted status from object:', { status, interestRate, duration, emiStartDate });
    }
    if (typeof status !== 'string' || !status.trim()) {
      console.log('Invalid status type or empty:', status);
      return res.status(400).json({ msg: 'Status must be a non-empty string' });
    }
    const normalizedStatus = status.toLowerCase().trim();
    if (!['approved', 'rejected', 'pending', 'completed'].includes(normalizedStatus)) {
      console.log('Invalid status value:', status);
      return res.status(400).json({ 
        msg: 'Invalid status. Must be "approved", "rejected", "pending", or "completed"' 
      });
    }
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      console.log(`Loan not found for ID: ${req.params.id}`);
      return res.status(404).json({ msg: 'Loan not found' });
    }
    loan.status = normalizedStatus;

    if (normalizedStatus === 'approved') {
      if (typeof interestRate !== 'number' || typeof duration !== 'number' || 
          interestRate <= 0 || duration <= 0) {
        console.log('Invalid interestRate or duration:', { interestRate, duration });
        return res.status(400).json({ 
          msg: 'Interest rate and duration must be positive numbers' 
        });
      }
      if (!emiStartDate || isNaN(new Date(emiStartDate).getTime())) {
        console.log('Invalid emiStartDate:', emiStartDate);
        return res.status(400).json({ msg: 'Valid EMI start date is required for approval' });
      }
      loan.interestRate = interestRate;
      loan.duration = duration;
      loan.emiAmount = calculateEMI(loan.amount, interestRate, duration);
      loan.totalAmountPayable = Number((loan.emiAmount * duration).toFixed(2));
      const startDate = new Date(emiStartDate);
      loan.payments = Array.from({ length: duration }, (_, i) => ({
        amount: loan.emiAmount,
        date: new Date(startDate.setMonth(startDate.getMonth() + i)),
        status: 'pending',
      }));
      
      // Deduct loan amount from balance when approved
      const balanceEntry = new Balance({
        amount: -Number(loan.amount),
        note: `Loan approved for user ${loan.user} (Loan ID: ${loan._id})`
      });
      await balanceEntry.save();
      console.log('Balance updated for loan approval:', balanceEntry);
      console.log('Updated EMI and payment schedule:', { 
        emiAmount: loan.emiAmount, 
        totalAmountPayable: loan.totalAmountPayable,
        emiStartDate: startDate,
        payments: loan.payments
      });
    }
    await loan.save();
    const totalBalance = await Balance.find().then(entries => 
      Number(entries.reduce((sum, entry) => sum + entry.amount, 0).toFixed(2))
    );
    console.log(`Loan ${normalizedStatus}:`, loan);
    res.json({
      msg: `Loan ${normalizedStatus} successfully`,
      loan: {
        _id: loan._id,
        status: loan.status,
        amount: Number(loan.amount),
        reason: loan.reason,
        interestRate: loan.interestRate,
        duration: loan.duration,
        totalAmountPayable: Number(loan.totalAmountPayable),
        emiAmount: Number(loan.emiAmount),
        payments: loan.payments
      },
      totalBalance
    });
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

// Get loan details by ID (admin or loan owner)
exports.getLoanDetails = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Loan Details: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const loan = await Loan.findById(req.params.id).populate('user', 'name');
    if (!loan) {
      return res.status(404).json({ msg: 'Loan not found' });
    }
    if (req.user.role !== 'admin' && loan.user._id.toString() !== req.user.id) {
      console.log(`Get Loan Details: Access denied for user ${req.user.id}`);
      return res.status(403).json({ msg: 'Access denied' });
    }
    const paidEMIs = loan.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingEMIs = loan.payments.filter(p => p.status === 'pending').length;
    console.log('Fetched loan details:', loan);
    res.json({
      loan,
      paidEMIs,
      pendingEMIs,
    });
  } catch (err) {
    console.error('Get Loan Details Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update EMI payment status (admin only)
exports.updatePaymentStatus = async (req, res) => {
  const { status } = req.body;
  const { id, paymentIndex } = req.params;
  try {
    if (!req.user) {
      console.error('Update Payment Status: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      console.log(`Update Payment Status: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (typeof status !== 'string' || !status.trim()) {
      console.log('Invalid status type or empty:', status);
      return res.status(400).json({ msg: 'Status must be a non-empty string' });
    }
    const normalizedStatus = status.toLowerCase().trim();
    if (!['paid', 'pending'].includes(normalizedStatus)) {
      console.log('Invalid payment status value:', status);
      return res.status(400).json({ msg: 'Invalid status. Must be "paid" or "pending"' });
    }
    const loan = await Loan.findById(id).populate('user', 'name');
    if (!loan) {
      console.log(`Loan not found for ID: ${id}`);
      return res.status(404).json({ msg: 'Loan not found' });
    }
    if (paymentIndex < 0 || paymentIndex >= loan.payments.length) {
      console.log(`Invalid payment index: ${paymentIndex}, loan payments length: ${loan.payments.length}`);
      return res.status(400).json({ msg: 'Invalid payment index' });
    }
    if (normalizedStatus === 'paid' && loan.payments[paymentIndex].status !== 'paid') {
      // Add EMI amount to balance when payment is marked as paid
      const balanceEntry = new Balance({
        amount: loan.payments[paymentIndex].amount,
        note: `EMI payment for Loan ID: ${loan._id}, Payment ${parseInt(paymentIndex) + 1}`
      });
      await balanceEntry.save();
      console.log('Balance updated for EMI payment:', balanceEntry);
    }
    loan.payments[paymentIndex].status = normalizedStatus;

    // Check if all payments are paid and update loan status to 'completed' if true
    const allPaymentsPaid = loan.payments.every(payment => payment.status === 'paid');
    if (allPaymentsPaid && loan.status !== 'completed') {
      loan.status = 'completed';
      console.log(`Loan ${id} status updated to completed as all EMIs are paid`);
    }

    await loan.save();
    const paidEMIs = loan.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingEMIs = loan.payments.filter(p => p.status === 'pending').length;
    const totalBalance = await Balance.find().then(entries => 
      entries.reduce((sum, entry) => sum + entry.amount, 0)
    );
    console.log(`Updated payment status for loan ${id}, payment ${paymentIndex}: ${normalizedStatus}`);
    res.json({
      msg: `Payment status updated to ${normalizedStatus}`,
      loan,
      paidEMIs,
      pendingEMIs,
      totalBalance
    });
  } catch (err) {
    console.error('Update Payment Status Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};