const Meeting = require('../models/Meeting');

// Create meeting (admin only)
exports.createMeeting = async (req, res) => {
  const { title, description, date, time } = req.body;
  try {
    if (!req.user) {
      console.error('Create Meeting: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Create Meeting: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    if (!title || !description || !date || !time) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    const meeting = new Meeting({ title, description, date, time });
    await meeting.save();
    console.log('Meeting created:', meeting);
    res.json({ msg: 'Meeting created', meeting });
  } catch (err) {
    console.error('Create Meeting Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get meetings (admin or staff)
exports.getMeetings = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Get Meetings: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const meetings = await Meeting.find()
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });
    const total = await Meeting.countDocuments();
    console.log('Fetched meetings:', meetings);
    res.json({ meetings, total });
  } catch (err) {
    console.error('Get Meetings Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update meeting (admin only)
exports.updateMeeting = async (req, res) => {
  const { title, description, date, time } = req.body;
  try {
    if (!req.user) {
      console.error('Update Meeting: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Update Meeting: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }
    meeting.title = title;
    meeting.description = description;
    meeting.date = date;
    meeting.time = time;
    await meeting.save();
    console.log('Updated meeting:', meeting);
    res.json({ msg: 'Meeting updated', meeting });
  } catch (err) {
    console.error('Update Meeting Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete meeting (admin only)
exports.deleteMeeting = async (req, res) => {
  try {
    if (!req.user) {
      console.error('Delete Meeting: req.user is undefined');
      return res.status(401).json({ msg: 'Not authorized, user not found' });
    }
    if (req.user.role !== 'admin') {
      console.log(`Delete Meeting: Access denied for user role ${req.user.role}`);
      return res.status(403).json({ msg: 'Admin access required' });
    }
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }
    await meeting.deleteOne();
    console.log('Deleted meeting:', meeting);
    res.json({ msg: 'Meeting deleted' });
  } catch (err) {
    console.error('Delete Meeting Error:', err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};