const Loan = require('../models/Loan');

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
    if (!amount || !reason || !interestRate || !duration) {
      return res.status(400).json({ msg: 'Amount, reason, interest rate, and duration are required' });
    }
    if (typeof amount !== 'number' || typeof interestRate !== 'number' || typeof duration !== 'number' || 
        amount <= 0 || interestRate <= 0 || duration <= 0) {
      return res.status(400).json({ msg: 'Amount, interest rate, and duration must be positive numbers' });
    }

    // Calculate EMI and total amount payable
    const emiAmount = calculateEMI(amount, interestRate, duration);
    const totalAmountPayable = emiAmount * duration;

    // Initialize payment schedule
    const payments = Array.from({ length: duration }, (_, i) => ({
      amount: emiAmount,
      date: new Date(new Date().setMonth(new Date().getMonth() + i + 1)),
      status: 'pending',
    }));

    const loan = new Loan({
      user: req.user.id,
      amount,
      reason,
      interestRate,
      duration,
      totalAmountPayable,
      emiAmount,
      payments,
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
  let { status, interestRate, duration } = req.body;
  try {
    // Validate user authentication
    if (!req.user) {
      console.error('Update Loan: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }

    // Restrict to admin role
    if (req.user.role !== 'admin') {
      console.log(`Update Loan: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }

    // Log request body for debugging
    console.log('Update Loan Request Body:', { status, interestRate, duration });

    // Handle case where status is an object
    if (typeof status === 'object' && status !== null && typeof status.status === 'string') {
      interestRate = status.interestRate || interestRate;
      duration = status.duration || duration;
      status = status.status;
      console.log('Extracted status from object:', { status, interestRate, duration });
    }

    // Validate status
    if (typeof status !== 'string' || !status.trim()) {
      console.log('Invalid status type or empty:', status);
      return res.status(400).json({ msg: 'Status must be a non-empty string' });
    }

    // Normalize and validate status
    const normalizedStatus = status.toLowerCase().trim();
    if (!['approved', 'rejected', 'pending'].includes(normalizedStatus)) {
      console.log('Invalid status value:', status);
      return res.status(400).json({ 
        msg: 'Invalid status. Must be "approved", "rejected", or "pending"' 
      });
    }

    // Find the loan
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      console.log(`Loan not found for ID: ${req.params.id}`);
      return res.status(404).json({ msg: 'Loan not found' });
    }

    // Update status
    loan.status = normalizedStatus;

    // Update interest rate and duration if provided
    if (interestRate && duration) {
      if (typeof interestRate !== 'number' || typeof duration !== 'number' || 
          interestRate <= 0 || duration <= 0) {
        console.log('Invalid interestRate or duration:', { interestRate, duration });
        return res.status(400).json({ 
          msg: 'Interest rate and duration must be positive numbers' 
        });
      }
      loan.interestRate = interestRate;
      loan.duration = duration;
      loan.emiAmount = calculateEMI(loan.amount, interestRate, duration);
      loan.totalAmountPayable = loan.emiAmount * duration;
      loan.payments = Array.from({ length: duration }, (_, i) => ({
        amount: loan.emiAmount,
        date: new Date(new Date().setMonth(new Date().getMonth() + i + 1)),
        status: 'pending',
      }));
      console.log('Updated EMI and payment schedule:', { 
        emiAmount: loan.emiAmount, 
        totalAmountPayable: loan.totalAmountPayable 
      });
    }

    // Save the loan
    await loan.save();
    console.log(`Loan ${normalizedStatus}:`, loan);

    // Return detailed response
    res.json({
      msg: `Loan ${normalizedStatus} successfully`,
      loan: {
        _id: loan._id,
        status: loan.status,
        amount: loan.amount,
        reason: loan.reason,
        interestRate: loan.interestRate,
        duration: loan.duration,
        totalAmountPayable: loan.totalAmountPayable,
        emiAmount: loan.emiAmount,
      },
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

    // Calculate paid and pending EMIs
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