const User = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register (staff only)
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User exists' });
    user = new User({ name, email, password: await bcrypt.hash(password, 10), isApproved: false });
    await user.save();
    res.json({ msg: 'Registered, awaiting approval' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (user.role === 'staff' && !user.isApproved) {
      return res.status(403).json({ msg: 'Account not approved' });
    }
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Approve user (admin only)
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'staff') return res.status(404).json({ msg: 'User not found' });
    user.isApproved = true;
    await user.save();
    res.json({ msg: 'User approved' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Reject user (admin only)
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'staff') return res.status(404).json({ msg: 'User not found' });
    if (user.isApproved) return res.status(400).json({ msg: 'User already approved' });
    await user.deleteOne();
    res.json({ msg: 'User rejected and removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  const { name, email, role, isApproved } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isApproved !== undefined) user.isApproved = isApproved;
    await user.save();
    res.json({ msg: 'User updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    await user.deleteOne();
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get pending users (admin only)
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'staff', isApproved: false });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all users with pagination (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const users = await User.find({ role: 'staff' }).skip(skip).limit(limit);
    const total = await User.countDocuments({ role: 'staff' });
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};