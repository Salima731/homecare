const mongoose = require('mongoose');

const responseNoteSchema = new mongoose.Schema({
  note: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const emergencyAlertSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    alertType: {
      type: String,
      enum: [
        'Medical Emergency',
        'Fall Incident',
        'Breathing Difficulty',
        'Medication Reaction',
        'Injury',
        'Hospital Transfer Required',
        'Other',
      ],
      required: true,
    },
    severityLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'],
      default: 'Open',
    },
    responseNotes: [responseNoteSchema],
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying by role
emergencyAlertSchema.index({ caregiverId: 1, status: 1 });
emergencyAlertSchema.index({ agencyId: 1, status: 1 });
emergencyAlertSchema.index({ patientId: 1, status: 1 });
emergencyAlertSchema.index({ hospitalId: 1, status: 1 });
emergencyAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
