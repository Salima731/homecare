const mongoose = require('mongoose');

const medicationLogSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver' },
  medicationName: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  takenAt: Date,
  status: { type: String, enum: ['pending', 'taken', 'missed', 'skipped'], default: 'pending' },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('MedicationLog', medicationLogSchema);
