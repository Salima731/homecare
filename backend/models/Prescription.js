const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  referral: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientReferral' },
  prescribedDate: { type: Date, required: true, default: Date.now },
  validUntil: Date,
  documents: [{ url: String, publicId: String, name: String }],
  medications: [{
    name: { type: String, required: true },
    dosage: String,           // e.g. "500mg"
    frequency: String,        // e.g. "twice daily"
    timings: [String],        // e.g. ["08:00", "20:00"]
    durationDays: Number,
    instructions: String,     // e.g. "take after food"
    isActive: { type: Boolean, default: true },
  }],
  notes: String,
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
