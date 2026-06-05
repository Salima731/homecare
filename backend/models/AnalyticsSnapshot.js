const mongoose = require('mongoose');

const analyticsSnapshotSchema = new mongoose.Schema({
  scope: { type: String, enum: ['platform', 'agency', 'hospital'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId }, // agencyId or hospitalId if not platform
  date: { type: Date, required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  metrics: {
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },
    agencyRevenue: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    newCaregivers: { type: Number, default: 0 },
    activeEmergencies: { type: Number, default: 0 },
    avgTrustScore: { type: Number, default: 0 },
    openComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    medicationAdherence: { type: Number, default: 0 }, // percentage
    healthAlerts: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 }, // percentage
  },
}, { timestamps: true });

analyticsSnapshotSchema.index({ scope: 1, entityId: 1, date: -1 });

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
