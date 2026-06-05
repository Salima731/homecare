const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 0,
    },
    platformCommission: { type: Number, default: 0 },
    agencyAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'razorpay', 'card', 'bank_transfer'],
      default: 'razorpay',
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    stripeChargeId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded', 'failed'],
      default: 'pending',
    },
    invoiceUrl: { type: String, default: '' },
    refundId: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    refundedAt: Date,
    paidAt: Date,
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1 });
paymentSchema.index({ agency: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
