const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Agency = require('../models/Agency');
const Caregiver = require('../models/Caregiver');
const Payment = require('../models/Payment');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { notifications } = require('../services/notificationService');

// Initialize Razorpay lazily to ensure it uses the latest environment variables
const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payments/create-order
 * @access  Private (User)
 */
const createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.isPaid) {
    res.status(400);
    throw new Error('Booking is already paid');
  }

  if (booking.totalAmount < 1) {
    res.status(400);
    throw new Error('Total booking amount must be at least 1 INR to create a Razorpay order');
  }

  const options = {
    amount: Math.round(booking.totalAmount * 100), // Amount in paise
    currency: 'INR',
    receipt: `receipt_${bookingId}`,
  };

  console.log('📦 Razorpay Order Options:', JSON.stringify(options, null, 2));

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create(options);
    
    // Save order ID to booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    successResponse(res, 201, 'Razorpay order created', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('❌ Razorpay Order Error:', error);
    const errorMessage = error.description || error.message || 'Unknown Razorpay error';
    res.status(500).json({
      success: false,
      message: `Razorpay Error: ${errorMessage}`,
      details: {
        code: error.code,
        description: error.description,
        metadata: error.metadata,
        reason: error.reason
      }
    });
  }
});

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/payments/verify
 * @access  Private (User)
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId
  } = req.body;

  // 1. Verify Signature
    const razorpay = getRazorpay();
    const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isSignatureValid = expectedSignature === razorpay_signature;

  if (!isSignatureValid) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  // 2. Update Booking
  const booking = await Booking.findById(bookingId).populate('caregiver');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Use stored breakdown from booking
  const { platformCommission, agencyAmount } = booking;

  // 3. Create Payment Record
  const payment = await Payment.create({
    booking: bookingId,
    user: booking.user,
    agency: booking.agency,
    caregiver: booking.caregiver?._id || booking.caregiver || undefined,
    amount: booking.totalAmount,
    platformCommission: booking.platformCommission,
    agencyAmount: booking.agencyAmount,
    currency: booking.currency || 'INR',
    paymentMethod: 'razorpay',
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    status: 'completed',
    paidAt: new Date(),
  });

  // 4. Update Booking Status
  booking.paymentStatus = 'paid';
  booking.razorpayPaymentId = razorpay_payment_id;
  booking.isPaid = true;
  booking.payment = payment._id;
  await booking.save();

  // 5. Update Agency earnings. Caregiver earnings are credited after assignment/completion.
  await Agency.findByIdAndUpdate(booking.agency, {
    $inc: { totalEarnings: agencyAmount }
  });

  // 6. Notifications
  if (req.io) {
    await notifications.paymentSuccess(req.io, req.user._id, payment._id);
  }

  successResponse(res, 200, 'Payment verified. Booking remains pending agency action.', {
    bookingId,
    paymentId: payment._id,
    status: booking.status
  });
});

/**
 * @desc    Get My Payments (User)
 * @route   GET /api/payments/my
 * @access  Private (User)
 */
const getMyPayments = asyncHandler(async (req, res) => {
  console.log(`🔍 Fetching payments for user: ${req.user._id}`);
  const filter = { user: req.user._id };
  
  const { docs, pagination } = await paginate(Payment, filter, {
    page: req.query.page,
    limit: req.query.limit,
    sort: '-createdAt',
    populate: [
      { path: 'booking', select: 'serviceType durationType startDate endDate status' },
      { path: 'agency', select: 'agencyName logo' }
    ]
  });

  console.log(`✅ Found ${docs.length} payments for user ${req.user._id}`);
  if (docs.length > 0) {
    console.log('Payment IDs:', docs.map(d => d._id).join(', '));
  }
  paginatedResponse(res, 200, 'Payments fetched successfully', docs, pagination);
});

module.exports = {
  createOrder,
  verifyPayment,
  getMyPayments,
};
