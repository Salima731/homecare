const { getConfig } = require('../utils/configStore');

const getCommissionRate = () => parseFloat(getConfig('PLATFORM_COMMISSION') || 10) / 100;

/**
 * Create a Stripe PaymentIntent
 * @param {number} amount - Total amount in dollars
 * @param {string} currency - 'usd'
 * @param {Object} metadata
 */
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  const amountInCents = Math.round(amount * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent;
};

/**
 * Calculate commission breakdown
 * @param {number} totalAmount
 * @returns { platformCommission, agencyAmount }
 */
const calculateCommission = (totalAmount) => {
  const platformCommission = parseFloat((totalAmount * getCommissionRate()).toFixed(2));
  const agencyAmount = parseFloat((totalAmount - platformCommission).toFixed(2));
  return { platformCommission, agencyAmount };
};

/**
 * Confirm payment and create payment record in DB
 */
const confirmPayment = async (paymentIntentId, bookingId, userId, agencyId) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not succeeded yet');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');

  const { platformCommission, agencyAmount } = calculateCommission(booking.totalAmount);

  const payment = await Payment.create({
    booking: bookingId,
    user: userId,
    agency: agencyId,
    amount: booking.totalAmount,
    platformCommission,
    agencyAmount,
    currency: paymentIntent.currency.toUpperCase(),
    paymentMethod: 'stripe',
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: paymentIntent.latest_charge || '',
    status: 'completed',
    paidAt: new Date(),
  });

  // Update booking as paid
  await Booking.findByIdAndUpdate(bookingId, {
    payment: payment._id,
    isPaid: true,
    platformCommission,
    agencyAmount,
  });

  return payment;
};

/**
 * Process a refund
 */
const processRefund = async (paymentId, reason = 'requested_by_customer') => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');
  if (payment.status === 'refunded') throw new Error('Already refunded');

  const amountInCents = Math.round(payment.amount * 100);

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    amount: amountInCents,
    reason,
  });

  await Payment.findByIdAndUpdate(paymentId, {
    status: 'refunded',
    refundId: refund.id,
    refundAmount: payment.amount,
    refundedAt: new Date(),
  });

  return refund;
};

module.exports = {
  createPaymentIntent,
  calculateCommission,
  confirmPayment,
  processRefund,
};
