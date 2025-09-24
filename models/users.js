const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['staff', 'admin'], default: 'staff' },
  isApproved: { type: Boolean, default: false },  // Pending approval for staff
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  designation: { type: String, required: true },
  dateOfJoining: { type: Date, required: true },
  department: { type: String, required: true },
  qualification: { type: String, required: true },
  photo: { type: String, required: false }, // Store file path
  nominee: { type: String, required: true },
  dateOfSocietyJoining: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);