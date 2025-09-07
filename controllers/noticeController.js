const Notice = require('../models/Notice');

// Create notice (admin only)
exports.createNotice = async (req, res) => {
  const { title, description } = req.body;
  try {
    if (!req.user) {
      console.error('Create Notice: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Create Notice: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (!title || !description) {
      return res.status(400).json({ msg: 'Title and description are required' });
    }
    const notice = new Notice({ title, description });
    await notice.save();
    console.log('Notice created:', notice);
    res.json({ msg: 'Notice created', notice });
  } catch (err) {
    console.error('Create Notice Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get notices (admin or staff)
exports.getNotices = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Notices: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notices = await Notice.find()
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });
    const total = await Notice.countDocuments();
    console.log('Fetched notices:', notices);
    res.json({ notices, total });
  } catch (err) {
    console.error('Get Notices Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update notice (admin only)
exports.updateNotice = async (req, res) => {
  const { title, description } = req.body;
  try {
    if (!req.user) {
      console.error('Update Notice: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Update Notice: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ msg: 'Notice not found' });
    }
    notice.title = title;
    notice.description = description;
    await notice.save();
    console.log('Updated notice:', notice);
    res.json({ msg: 'Notice updated', notice });
  } catch (err) {
    console.error('Update Notice Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete notice (admin only)
exports.deleteNotice = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Delete Notice: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Delete Notice: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ msg: 'Notice not found' });
    }
    await notice.deleteOne();
    console.log('Deleted notice:', notice);
    res.json({ msg: 'Notice deleted' });
  } catch (err) {
    console.error('Delete Notice Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};