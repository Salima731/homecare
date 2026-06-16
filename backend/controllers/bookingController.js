const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Caregiver = require('../models/Caregiver');
const Agency = require('../models/Agency');
const Patient = require('../models/Patient');
const Schedule = require('../models/Schedule');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { createNotification, notifications } = require('../services/notificationService');
const { sendBookingConfirmationEmail } = require('../services/emailService');
const { calculateCommission } = require('../services/paymentService');

const parseAddress = (address) => {
  if (typeof address === 'object' && address !== null) return address;
  try {
    return JSON.parse(address);
  } catch (e) {
    return { street: address };
  }
};

const calculateBookingDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid start or end date');
  }

  if (end < start) {
    throw new Error('End date cannot be before start date');
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.ceil((end - start) / msPerDay));
  const totalHours = totalDays * 8;

  return { start, end, totalDays, totalHours };
};

const calculateTotalAmount = (rateApplied, durationType, totalDays, totalHours) => {
  switch (durationType) {
    case 'hourly':
      return rateApplied * totalHours;
    case 'daily':
      return rateApplied * totalDays;
    case 'weekly':
      return rateApplied * Math.ceil(totalDays / 7);
    case 'monthly':
      return rateApplied * Math.ceil(totalDays / 30);
    default:
      return 0;
  }
};

// ─── Create Booking ───────────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const {
    agencyId, serviceType, durationType,
    startDate, endDate, startTime, endTime,
    address, specialInstructions,
  } = req.body;

  if (!agencyId) {
    res.status(400);
    throw new Error('agencyId is required');
  }

  const agency = await Agency.findById(agencyId);
  if (!agency || agency.status !== 'approved') {
    res.status(400);
    throw new Error('Agency is not available for booking');
  }

  let duration;
  try {
    duration = calculateBookingDuration(startDate, endDate);
  } catch (err) {
    res.status(400);
    throw err;
  }

  const rateField = `rates.${durationType}`;
  const availableCaregivers = await Caregiver.find({
    agency: agency._id,
    serviceType,
    isVerified: true,
    isActive: true,
    isBanned: false,
    [rateField]: { $gt: 0 },
  }).select('rates');

  if (availableCaregivers.length === 0) {
    res.status(400);
    throw new Error('No verified active caregivers are available for this service and rate type');
  }

  const rateApplied = Math.min(
    ...availableCaregivers.map((caregiver) => caregiver.rates?.[durationType] || Infinity),
  );
  const totalAmount = calculateTotalAmount(
    rateApplied,
    durationType,
    duration.totalDays,
    duration.totalHours,
  );

  if (!rateApplied || rateApplied <= 0) {
    res.status(400);
    throw new Error(`The selected rate (${durationType}) is not available for this agency.`);
  }

  if (totalAmount < 1) {
    res.status(400);
    throw new Error('Total booking amount must be at least 1 INR for payment processing.');
  }

  const { platformCommission, agencyAmount } = calculateCommission(totalAmount);

  const booking = await Booking.create({
    user: req.user._id,
    agency: agency._id,
    serviceType,
    durationType,
    startDate: duration.start,
    endDate: duration.end,
    startTime,
    endTime,
    totalHours: duration.totalHours,
    totalDays: duration.totalDays,
    rateApplied,
    totalAmount,
    platformCommission,
    agencyAmount,
    address: parseAddress(address),
    specialInstructions,
    status: 'pending',
  });

  // Notify user
  if (req.io) await notifications.bookingCreated(req.io, req.user._id, booking._id);

  // Notify agency
  if (req.io) {
    await notifications.bookingCreated(req.io, agency.user, booking._id);
  }

  successResponse(res, 201, 'Booking created successfully', booking);
});

// ─── Get My Bookings (User) ───────────────────────────────────────────────────
const getMyBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const { docs, pagination } = await paginate(Booking, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: [
      { path: 'caregiver', select: 'name serviceType profileImage avgRating' },
      { path: 'agency', select: 'agencyName logo' },
    ],
  });

  paginatedResponse(res, 200, 'Bookings fetched', docs, pagination);
});

// ─── Get Agency Bookings ──────────────────────────────────────────────────────
const getAgencyBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) { res.status(404); throw new Error('Agency not found'); }

  const filter = { agency: agency._id };
  if (status) filter.status = status;

  const { docs, pagination } = await paginate(Booking, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: [
      { path: 'user', select: 'name email phone avatar' },
      { path: 'caregiver', select: 'name serviceType profileImage' },
    ],
  });

  paginatedResponse(res, 200, 'Agency bookings fetched', docs, pagination);
});

// ─── Get Single Booking ───────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email phone avatar')
    .populate('caregiver', 'name serviceType profileImage rates avgRating')
    .populate('agency', 'agencyName logo phone')
    .populate('payment');

  if (!booking) { res.status(404); throw new Error('Booking not found'); }

  // Authorization: only owner, caregiver, agency, or admin
  const isOwner = booking.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  const agency = await Agency.findOne({ user: req.user._id });
  const isAgency = agency && booking.agency._id.toString() === agency._id.toString();
  
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  const isCaregiver =
    caregiver &&
    booking.caregiver &&
    booking.caregiver._id.toString() === caregiver._id.toString();

  if (!isOwner && !isAdmin && !isAgency && !isCaregiver) {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  successResponse(res, 200, 'Booking fetched', booking);
});

// ─── Accept Booking (Agency) ──────────────────────────────────────────────────
const acceptBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) { res.status(404); throw new Error('Booking not found'); }

  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency || booking.agency.toString() !== agency._id.toString()) {
    res.status(403);
    throw new Error('Only the owning agency can accept this booking');
  }

  if (booking.status !== 'pending') {
    res.status(400);
    throw new Error(`Cannot accept a booking with status: ${booking.status}`);
  }

  booking.status = 'accepted';
  booking.acceptedAt = new Date();
  await booking.save();

  if (req.io) await notifications.bookingAccepted(req.io, booking.user, booking._id);

  successResponse(res, 200, 'Booking accepted', booking);
});

// Agency: Assign caregiver after accepting booking
const assignCaregiverToBooking = asyncHandler(async (req, res) => {
  const { caregiverId } = req.body;
  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) { res.status(404); throw new Error('Agency not found'); }

  const booking = await Booking.findOne({ _id: req.params.id, agency: agency._id });
  if (!booking) { res.status(404); throw new Error('Booking not found in your agency'); }

  if (!['accepted', 'assigned'].includes(booking.status)) {
    res.status(400);
    throw new Error('Only accepted bookings can be assigned');
  }

  const caregiver = await Caregiver.findOne({
    _id: caregiverId,
    agency: agency._id,
    serviceType: booking.serviceType,
    isVerified: true,
    isActive: true,
    isBanned: false,
  });
  if (!caregiver) {
    res.status(400);
    throw new Error('Selected caregiver is not verified, active, or part of this agency/service');
  }

  const conflict = await Booking.findOne({
    _id: { $ne: booking._id },
    caregiver: caregiver._id,
    status: { $in: ['assigned', 'ongoing'] },
    startDate: { $lte: booking.endDate },
    endDate: { $gte: booking.startDate },
  });
  if (conflict) {
    res.status(400);
    throw new Error('Caregiver is already assigned to another booking for these dates');
  }

  booking.caregiver = caregiver._id;
  booking.status = 'assigned';
  await booking.save();

  const User = require('../models/User');
  await User.findByIdAndUpdate(
    booking.user,
    { assignedCaregiver: caregiver._id },
  );

  if (req.io) {
    await createNotification(req.io, {
      recipient: caregiver.user,
      type: 'booking_assigned',
      title: 'New Job Assigned',
      message: `You have been assigned to a ${booking.serviceType.replace('_', ' ')} booking.`,
      data: { bookingId: booking._id },
    });
  }

  const populated = await Booking.findById(booking._id)
    .populate('user', 'name email phone avatar')
    .populate('caregiver', 'name serviceType profileImage')
    .populate('agency', 'agencyName logo phone');

  successResponse(res, 200, 'Caregiver assigned successfully', populated);
});

// ─── Cancel Booking ───────────────────────────────────────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) { res.status(404); throw new Error('Booking not found'); }

  const isOwner = booking.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const agency = req.user.role === 'agency'
    ? await Agency.findOne({ user: req.user._id })
    : null;
  const isAgency = agency && booking.agency.toString() === agency._id.toString();

  if (!isOwner && !isAdmin && !isAgency) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  if (['completed', 'cancelled'].includes(booking.status)) {
    res.status(400);
    throw new Error(`Booking is already ${booking.status}`);
  }

  booking.status = 'cancelled';
  booking.cancellationReason = reason || '';
  booking.cancelledBy = req.user._id;
  await booking.save();

  if (booking.caregiver) {
    const { calculateTrustScore } = require('../services/trustScoreService');
    await calculateTrustScore(booking.caregiver.toString());
  }

  if (req.io) await notifications.bookingCancelled(req.io, booking.user, booking._id, reason);

  successResponse(res, 200, 'Booking cancelled', booking);
});

// ─── Complete Booking (Agency/Admin) ──────────────────────────────────────────
const completeBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  if (booking.status !== 'ongoing') {
    res.status(400);
    throw new Error('Only ongoing bookings can be completed');
  }

  booking.status = 'completed';
  booking.completedAt = new Date();
  await booking.save();

  if (booking.caregiver) {
    await Caregiver.findByIdAndUpdate(booking.caregiver, {
      $inc: { completedBookings: 1 },
    });

    const { calculateTrustScore } = require('../services/trustScoreService');
    await calculateTrustScore(booking.caregiver.toString());
  }

  if (req.io) await notifications.bookingCompleted(req.io, booking.user, booking._id);

  successResponse(res, 200, 'Booking completed', booking);
});

// ─── Clock In (Caregiver) ───────────────────────────────────────────────────
const clockInBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) { res.status(404); throw new Error('Booking not found'); }

  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver || !booking.caregiver || booking.caregiver.toString() !== caregiver._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to clock in for this booking');
  }

  if (booking.status !== 'assigned') {
    res.status(400);
    throw new Error('Can only clock in for assigned bookings');
  }

  booking.status = 'ongoing';
  booking.startedAt = new Date();
  
  // Generate a 4-digit Completion OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  booking.completionOTP = otp;
  
  await booking.save();

  // Notify user with the OTP
  if (req.io) {
    await createNotification(req.io, {
      recipient: booking.user,
      type: 'service_otp',
      title: 'Service Started - Completion OTP',
      message: `Your service has started. Provide this OTP to the caregiver ONLY when the service is fully completed: ${otp}`,
      data: { bookingId: booking._id, otp }
    });
  }

  successResponse(res, 200, 'Clocked in successfully. User has been sent the completion OTP.', booking);
});

// ─── Clock Out (Caregiver) ──────────────────────────────────────────────────
const clockOutBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) { res.status(404); throw new Error('Booking not found'); }

  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver || !booking.caregiver || booking.caregiver.toString() !== caregiver._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to clock out for this booking');
  }

  if (booking.status !== 'ongoing') {
    res.status(400);
    throw new Error('Can only clock out for ongoing bookings');
  }

  // Verify Completion OTP
  const { otp } = req.body;
  if (!otp || otp !== booking.completionOTP) {
    res.status(400);
    throw new Error('Invalid completion OTP. Please ask the user for the code.');
  }

  booking.status = 'completed';
  booking.isCompletionVerified = true;
  booking.completedAt = new Date();
  await booking.save();

  // Update caregiver stats
  await Caregiver.findByIdAndUpdate(booking.caregiver, {
    $inc: { completedBookings: 1 },
  });

  // Recalculate Trust Score for the caregiver
  const { calculateTrustScore } = require('../services/trustScoreService');
  await calculateTrustScore(booking.caregiver.toString());

  if (req.io) await notifications.bookingCompleted(req.io, booking.user, booking._id);

  successResponse(res, 200, 'Clocked out successfully', booking);
});

// ─── Get Caregiver Bookings ──────────────────────────────────────────────────
const getCaregiverBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  console.log(`🔍 Fetching bookings for caregiver: ${caregiver._id} (User: ${req.user._id})`);
  const filter = { caregiver: caregiver._id };
  if (status) {
    filter.status = status;
    console.log(`🎯 Status filter applied: ${status}`);
  }

  const { docs, pagination } = await paginate(Booking, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: [
      { path: 'user', select: 'name email phone avatar' },
      { path: 'agency', select: 'agencyName logo' },
    ],
  });

  paginatedResponse(res, 200, 'Caregiver bookings fetched', docs, pagination);
});

// ─── Admin: Get All Bookings ──────────────────────────────────────────────────
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, serviceType } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (serviceType) filter.serviceType = serviceType;

  const { docs, pagination } = await paginate(Booking, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: [
      { path: 'user', select: 'name email' },
      { path: 'caregiver', select: 'name serviceType' },
      { path: 'agency', select: 'agencyName' },
    ],
  });

  paginatedResponse(res, 200, 'All bookings fetched', docs, pagination);
});

// ─── Get Patient Bookings (Family/Admin) ──────────────────────────────────────
const getPatientBookings = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

  const User = require('../models/User');
  if (!patient) {
    const userExists = await User.findById(patientId);
    if (!userExists) {
      res.status(404);
      throw new Error('Patient not found');
    }
    patient = {
      _id: null,
      user: userExists._id,
      name: userExists.name,
    };
  }

  const patientUserId = patient.user?._id || patient.user;
  const patientDocId = patient._id;

  // Access control
  const isAdmin = req.user.role === 'admin';
  const isOwner = String(patientUserId) === String(req.user._id);
  
  let isFamilyAuthorized = false;
  if (req.user.role === 'family') {
    const FamilyMember = require('../models/FamilyMember');
    const orQuery = [{ patient: patientUserId }];
    if (patientDocId) orQuery.push({ patient: patientDocId });
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      $or: orQuery,
    });
    isFamilyAuthorized = !!fm;
  }

  if (!isAdmin && !isOwner && !isFamilyAuthorized) {
    res.status(403);
    throw new Error('Access denied to patient bookings');
  }

  const filter = { user: patientUserId }; // Bookings are tied to the User ID of the patient
  if (req.query.status) filter.status = req.query.status;

  const { docs, pagination } = await paginate(Booking, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: 'caregiver', select: 'name serviceType profileImage avgRating' },
      { path: 'agency', select: 'agencyName logo' },
    ],
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'Patient bookings fetched', docs, pagination);
});

module.exports = {
  createBooking,
  getMyBookings,
  getAgencyBookings,
  getBookingById,
  acceptBooking,
  assignCaregiverToBooking,
  completeBooking,
  cancelBooking,
  getCaregiverBookings,
  clockInBooking,
  clockOutBooking,
  getAllBookings,
  getPatientBookings,
};
