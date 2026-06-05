const mongoose = require('mongoose');

const emergencyIncidentSchema = new mongoose.Schema({
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  triggerRole: { type: String, enum: ['caregiver', 'patient', 'user', 'family'], required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String,
    accuracy: Number,
  },
  type: { type: String, enum: ['medical', 'safety', 'fall', 'cardiac', 'other'], default: 'medical' },
  description: String,
  status: { type: String, enum: ['active', 'acknowledged', 'responding', 'resolved', 'false_alarm'], default: 'active' },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high' },
  notifiedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notifiedHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: Date,
  resolvedAt: Date,
  resolutionNote: String,
  locationHistory: [{
    lat: Number, lng: Number, recordedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model('EmergencyIncident', emergencyIncidentSchema);
