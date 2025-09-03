const InterestRate = require('../models/interestRate');

exports.getAllInterestRates = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Interest Rates: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Get Interest Rates: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const interestRates = await InterestRate.find({}).sort('effectiveDate');
    console.log('Fetched interest rates:', interestRates);
    res.json({ data: interestRates });
  } catch (err) {
    console.error('Get Interest Rates Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.addInterestRate = async (req, res) => {
  console.log('Request body:', req.body);
  const { rate, effectiveDate } = req.body || {};
  try {
    if (!req.user) {
      console.error('Add Interest Rate: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Add Interest Rate: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (!req.body) {
      return res.status(400).json({ msg: 'Request body is missing' });
    }
    if (!rate || !effectiveDate) {
      return res.status(400).json({ msg: 'Rate and effective date are required' });
    }
    if (rate <= 0) {
      return res.status(400).json({ msg: 'Interest rate must be positive' });
    }
    const interestRate = new InterestRate({ rate, effectiveDate });
    await interestRate.save();
    console.log('Interest rate recorded:', interestRate);
    res.json({ msg: 'Interest rate recorded', data: interestRate });
  } catch (err) {
    console.error('Add Interest Rate Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.updateInterestRate = async (req, res) => {
  console.log('Request body:', req.body);
  const { rate, effectiveDate } = req.body || {};
  try {
    if (!req.user) {
      console.error('Update Interest Rate: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Update Interest Rate: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (!req.body) {
      return res.status(400).json({ msg: 'Request body is missing' });
    }
    if (!rate || !effectiveDate) {
      return res.status(400).json({ msg: 'Rate and effective date are required' });
    }
    if (rate <= 0) {
      return res.status(400).json({ msg: 'Interest rate must be positive' });
    }
    const interestRate = await InterestRate.findById(req.params.id);
    if (!interestRate) {
      return res.status(404).json({ msg: 'Interest rate not found' });
    }
    interestRate.rate = rate;
    interestRate.effectiveDate = effectiveDate;
    await interestRate.save();
    console.log('Updated interest rate:', interestRate);
    res.json({ msg: 'Interest rate updated', data: interestRate });
  } catch (err) {
    console.error('Update Interest Rate Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.deleteInterestRate = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Delete Interest Rate: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Delete Interest Rate: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const interestRate = await InterestRate.findById(req.params.id);
    if (!interestRate) {
      return res.status(404).json({ msg: 'Interest rate not found' });
    }
    await interestRate.deleteOne();
    console.log('Deleted interest rate:', interestRate);
    res.json({ msg: 'Interest rate deleted' });
  } catch (err) {
    console.error('Delete Interest Rate Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getCurrentInterestRateInternal = async () => {
  try {
    const interestRate = await InterestRate.findOne({})
      .sort({ effectiveDate: -1 });
    return interestRate ? interestRate.rate : null;
  } catch (err) {
    console.error('Get Current Interest Rate Error:', err.stack);
    throw new Error('Failed to fetch current interest rate');
  }
};