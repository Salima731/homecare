const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    serviceType: {
      type: String,
      enum: ['babysitter', 'nurse', 'elder_care', 'special_needs'],
      required: true,
    },
    durationType: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    startTime: { type: String }, // "09:00"
    endTime: { type: String },   // "17:00"
    totalHours: { type: Number, default: 0 },
    totalDays: { type: Number, default: 0 },
    rateApplied: { type: Number, required: true },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    platformCommission: { type: Number, default: 0 },
    agencyAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'assigned', 'ongoing', 'completed', 'cancelled'],
      default: 'pending',
    },
    cancellationReason: { type: String, default: '' },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    specialInstructions: { type: String, maxlength: 500 },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    isPaid: { type: Boolean, default: false },
    completionOTP: { type: String },
    isCompletionVerified: { type: Boolean, default: false },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ caregiver: 1, status: 1 });
bookingSchema.index({ agency: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
