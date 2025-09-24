
const User = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register (staff only)
exports.register = async (req, res) => {
  const {
    name,
    email,
    password,
    address,
    phoneNumber,
    designation,
    dateOfJoining,
    department,
    qualification,
    nominee,
    dateOfSocietyJoining,
  } = req.body;

  try {
    if (
      !name ||
      !email ||
      !password ||
      !address ||
      !phoneNumber ||
      !designation ||
      !dateOfJoining ||
      !department ||
      !qualification ||
      !nominee ||
      !dateOfSocietyJoining
    ) {
      return res.status(400).json({ msg: 'All fields are required except photo' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ msg: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ msg: 'Phone number must be 10 digits' });
    }
    if (new Date(dateOfJoining) > new Date()) {
      return res.status(400).json({ msg: 'Date of joining cannot be in the future' });
    }
    if (new Date(dateOfSocietyJoining) > new Date()) {
      return res.status(400).json({ msg: 'Date of society joining cannot be in the future' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      address,
      phoneNumber,
      designation,
      dateOfJoining: new Date(dateOfJoining),
      department,
      qualification,
      photo: req.file ? req.file.path : null,
      nominee,
      dateOfSocietyJoining: new Date(dateOfSocietyJoining),
      isApproved: false,
      role: 'staff',
    });

    await user.save();
    res.json({ msg: 'Registered, awaiting approval' });
  } catch (err) {
    console.error('Register Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
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
    console.error('Login Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get Current User Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Approve user (admin only)
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'staff') {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.isApproved = true;
    await user.save();
    res.json({ msg: 'User approved' });
  } catch (err) {
    console.error('Approve User Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Reject user (admin only)
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'staff') {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (user.isApproved) {
      return res.status(400).json({ msg: 'User already approved' });
    }
    await user.deleteOne();
    res.json({ msg: 'User rejected and removed' });
  } catch (err) {
    console.error('Reject User Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update user (self or admin)
exports.updateUser = async (req, res) => {
  const {
    name,
    email,
    password,
    address,
    phoneNumber,
    designation,
    dateOfJoining,
    department,
    qualification,
    nominee,
    dateOfSocietyJoining,
    role,
    isApproved,
  } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }

    // Determine the target user
    const userId = req.params.id || req.user.id; // Use req.params.id for admin updates, req.user.id for self-updates
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Restrict updates to self or admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) {
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ msg: 'Invalid email format' });
      }
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
      user.email = email;
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters' });
      }
      user.password = await bcrypt.hash(password, 10);
    }
    if (address) user.address = address;
    if (phoneNumber) {
      if (!/^\d{10}$/.test(phoneNumber)) {
        return res.status(400).json({ msg: 'Phone number must be 10 digits' });
      }
      user.phoneNumber = phoneNumber;
    }
    if (designation) user.designation = designation;
    if (dateOfJoining) {
      if (new Date(dateOfJoining) > new Date()) {
        return res.status(400).json({ msg: 'Date of joining cannot be in the future' });
      }
      user.dateOfJoining = new Date(dateOfJoining);
    }
    if (department) user.department = department;
    if (qualification) user.qualification = qualification;
    if (nominee) user.nominee = nominee;
    if (dateOfSocietyJoining) {
      if (new Date(dateOfSocietyJoining) > new Date()) {
        return res.status(400).json({ msg: 'Date of society joining cannot be in the future' });
      }
      user.dateOfSocietyJoining = new Date(dateOfSocietyJoining);
    }
if (req.file) {
      user.photo = req.file.path.replace(/\\/g, '/'); // Normalize to forward slashes
    }
    // Admin-only fields
    if (req.user.role === 'admin') {
      if (role && ['staff', 'admin'].includes(role)) user.role = role;
      if (isApproved !== undefined) user.isApproved = isApproved;
    }

    await user.save();
    res.json({ msg: 'User updated' });
  } catch (err) {
    console.error('Update User Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    await user.deleteOne();
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error('Delete User Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get pending users (admin only)
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'staff', isApproved: false });
    res.json(users);
  } catch (err) {
    console.error('Get Pending Users Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
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
    console.error('Get All Users Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};