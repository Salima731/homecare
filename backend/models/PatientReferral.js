const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referredBy: { // Doctor or Hospital staff
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'referredBy.entityType' },
    entityType: { type: String, enum: ['Doctor', 'Hospital'] },
  },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  assignedAgency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  assignedCaregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver' },
  serviceType: { type: String, enum: ['babysitter', 'nurse', 'elder_care', 'special_needs'] },
  medicalNotes: { type: String, maxlength: 2000 },
  prescriptions: [{ url: String, publicId: String, name: String }],
  urgency: { type: String, enum: ['routine', 'urgent', 'emergency'], default: 'routine' },
  status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  dischargeDate: Date,
  homeCarePlan: { type: String, maxlength: 2000 },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  adminNote: String,
}, { timestamps: true });

module.exports = mongoose.model('PatientReferral', referralSchema);
