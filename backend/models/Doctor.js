const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  licenseNumber: { type: String, unique: true, sparse: true },
  qualification: [String],
  experience: { type: Number, default: 0 },
  phone: String,
  profileImage: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  bio: { type: String, default: '' },
  consultationFee: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
