const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  hospitalName: { type: String, required: true, trim: true, maxlength: 200 },
  registrationNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['government', 'private', 'clinic', 'nursing_home'], default: 'private' },
  address: { street: String, city: String, state: String, country: String, zipCode: String },
  phone: String,
  email: String,
  website: String,
  logo: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  documents: [{ name: String, url: String, publicId: String, uploadedAt: { type: Date, default: Date.now } }],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  adminNote: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  emergencyContact: { name: String, phone: String, email: String },
  location: { lat: Number, lng: Number },
  totalPatients: { type: Number, default: 0 },
  totalReferrals: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
