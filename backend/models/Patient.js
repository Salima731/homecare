const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'], default: 'unknown' },
  allergies: [String],
  chronicConditions: [String],
  emergencyContact: {
    name: String, relationship: String, phone: String, email: String,
  },
  assignedCaregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver' },
  assignedHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  familyMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' }],
  familyAccessCode: String,
  familyAccessCodeExpires: Date,
  insuranceProvider: String,
  insurancePolicyNumber: String,
  address: { street: String, city: String, state: String, zipCode: String },
  profileImage: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
