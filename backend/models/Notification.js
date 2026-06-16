const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_accepted',
        'booking_assigned',
        'booking_rejected',
        'booking_started',
        'booking_completed',
        'booking_cancelled',
        'payment_success',
        'payment_failed',
        'complaint_raised',
        'complaint_resolved',
        'review_received',
        'agency_approved',
        'agency_rejected',
        'caregiver_verified',
        'new_message',
        'service_otp',
        'system',
        'sos_triggered',
        'sos_resolved',
        'emergency_sos',
        'health_alert',
        'medication_reminder',
        'medication_missed',
        'health_report_submitted',
        'hospital_referral',
        'discharge_assigned',
        'attendance_checked_in',
        'attendance_late',
        'family_report_shared',
        'emergency_broadcast',
        'medical_record_uploaded',
        'medical_record_updated',
        'emergency_alert_raised',
        'emergency_alert_resolved',
        'care_report_submitted',
        'care_report_updated',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

module.exports = mongoose.model('Notification', notificationSchema);
