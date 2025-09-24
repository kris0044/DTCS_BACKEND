// Backend: controllers/resignation.js
const Resignation = require('../models/Resignation');

// Request resignation (staff only)
exports.requestResignation = async (req, res) => {
  const { reason, leavingDate, feedback } = req.body;
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'staff') {
      return res.status(403).json({ msg: 'Staff access required' });
    }
    if (!reason || !leavingDate) {
      return res.status(400).json({ msg: 'Reason and leaving date are required' });
    }
    const resignation = new Resignation({
      user: req.user.id,
      reason,
      leavingDate: new Date(leavingDate),
      feedback,
    });
    await resignation.save();
    res.json({ msg: 'Resignation requested', resignation });
  } catch (err) {
    console.error('Request Resignation Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update resignation (admin only)
exports.updateResignation = async (req, res) => {
  const { status, reason, leavingDate, feedback } = req.body;
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (typeof status !== 'string' || !status.trim()) {
      return res.status(400).json({ msg: 'Status must be a non-empty string' });
    }
    const normalizedStatus = status.toLowerCase().trim();
    if (!['approved', 'rejected', 'pending'].includes(normalizedStatus)) {
      return res.status(400).json({ 
        msg: 'Invalid status. Must be "approved", "rejected", or "pending"' 
      });
    }
    const resignation = await Resignation.findById(req.params.id);
    if (!resignation) {
      return res.status(404).json({ msg: 'Resignation not found' });
    }
    resignation.status = normalizedStatus;
    if (reason) resignation.reason = reason;
    if (leavingDate) resignation.leavingDate = new Date(leavingDate);
    if (feedback) resignation.feedback = feedback;
    await resignation.save();
    res.json({
      msg: `Resignation ${normalizedStatus} successfully`,
      resignation,
    });
  } catch (err) {
    console.error('Update Resignation Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete resignation (admin only)
exports.deleteResignation = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const resignation = await Resignation.findById(req.params.id);
    if (!resignation) {
      return res.status(404).json({ msg: 'Resignation not found' });
    }
    await resignation.deleteOne();
    res.json({ msg: 'Resignation deleted' });
  } catch (err) {
    console.error('Delete Resignation Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get resignations (admin or self)
exports.getResignations = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const resignations = await Resignation.find(query)
      .populate('user', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });
    const total = await Resignation.countDocuments(query);
    res.json({ resignations, total });
  } catch (err) {
    console.error('Get Resignations Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get resignation details by ID (admin or owner)
exports.getResignationDetails = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const resignation = await Resignation.findById(req.params.id).populate('user', 'name');
    if (!resignation) {
      return res.status(404).json({ msg: 'Resignation not found' });
    }
    if (req.user.role !== 'admin' && resignation.user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    res.json({ resignation });
  } catch (err) {
    console.error('Get Resignation Details Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};