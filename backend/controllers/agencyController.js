const asyncHandler = require('express-async-handler');
const Agency = require('../models/Agency');
const User = require('../models/User');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { uploadDocument, deleteFromCloudinary } = require('../services/cloudinaryService');
const { createNotification, notifications } = require('../services/notificationService');
const PatientReferral = require('../models/PatientReferral');
const Booking = require('../models/Booking');
const Caregiver = require('../models/Caregiver');



// ─── Register Agency ──────────────────────────────────────────────────────────
const registerAgency = asyncHandler(async (req, res) => {
  const { agencyName, description, licenseNumber, phone, address, website } = req.body;

  const existing = await Agency.findOne({ user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('Agency profile already exists for this account');
  }

  const licCheck = await Agency.findOne({ licenseNumber });
  if (licCheck) {
    res.status(400);
    throw new Error('An agency with this license number already exists');
  }

  let parsedAddress = { street: address || '' };
  if (address && typeof address === 'string' && address.startsWith('{')) {
    try {
      parsedAddress = JSON.parse(address);
    } catch (err) {
      console.error('❌ Address parse error:', err);
    }
  }

  const agency = await Agency.create({
    user: req.user._id,
    agencyName,
    description,
    licenseNumber,
    phone,
    address: parsedAddress,
    website,
  });

  successResponse(res, 201, 'Agency registered. Awaiting admin approval.', agency);
});

// ─── Get My Agency Profile ────────────────────────────────────────────────────
const getMyAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findOne({ user: req.user._id }).populate('user', 'name email');
  
  if (!agency) {
    return successResponse(res, 200, 'Agency profile not found', null);
  }
  
  successResponse(res, 200, 'Agency profile fetched', agency);
});

// ─── Update Agency Profile ────────────────────────────────────────────────────
const updateAgency = asyncHandler(async (req, res) => {
  const { agencyName, description, phone, address, website } = req.body;

  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) {
    res.status(404);
    throw new Error('Agency not found');
  }

  if (agencyName) agency.agencyName = agencyName;
  if (description) agency.description = description;
  if (phone) agency.phone = phone;
  if (website) agency.website = website;
  if (address) {
    agency.address = (typeof address === 'string' && address.startsWith('{')) 
      ? JSON.parse(address) 
      : { street: address };
  }

  // Handle logo upload
  if (req.file) {
    if (agency.logo?.publicId) await deleteFromCloudinary(agency.logo.publicId);
    const { url, publicId } = await uploadDocument(req.file.buffer, 'logos');
    agency.logo = { url, publicId };
  }

  const updated = await agency.save();
  successResponse(res, 200, 'Agency updated', updated);
});

// ─── Upload Agency Documents ──────────────────────────────────────────────────
const uploadAgencyDocuments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }

  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) {
    res.status(404);
    throw new Error('Agency not found');
  }

  const uploaded = await Promise.all(
    req.files.map(async (file) => {
      const { url, publicId } = await uploadDocument(file.buffer, 'agency-docs');
      return { name: file.originalname, url, publicId };
    })
  );

  agency.documents.push(...uploaded);
  await agency.save();

  successResponse(res, 200, 'Documents uploaded', agency.documents);
});

// ─── Get All Agencies (Public + Admin) ───────────────────────────────────────
const getAllAgencies = asyncHandler(async (req, res) => {
  
  const { status, search } = req.query;
  console.log(req.query)
  const filter = {};

  // Non-admin users only see approved agencies
  if (req.user?.role !== 'admin') filter.status = 'approved';
  else if (status) filter.status = status;

  if (search) filter.$or = [
    { agencyName: new RegExp(search, 'i') },
    { licenseNumber: new RegExp(search, 'i') },
  ];

  const { docs, pagination } = await paginate(Agency, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: { path: 'user', select: 'name email' },
  });

  paginatedResponse(res, 200, 'Agencies fetched', docs, pagination);
});

// ─── Get Single Agency (Public) ───────────────────────────────────────────────
const getAgencyById = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id).populate('user', 'name email');
  if (!agency) {
    res.status(404);
    throw new Error('Agency not found');
  }
  successResponse(res, 200, 'Agency fetched', agency);
});

// ─── Admin: Approve Agency ────────────────────────────────────────────────────
const approveAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', isVerified: true, adminNote: '' },
    { new: true }
  );
  if (!agency) {
    res.status(404);
    throw new Error('Agency not found');
  }

  // Notify agency owner
  if (req.io) {
    await notifications.agencyApproved(req.io, agency.user);
  }

  successResponse(res, 200, 'Agency approved', agency);
});

// ─── Admin: Reject Agency ─────────────────────────────────────────────────────
const rejectAgency = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const agency = await Agency.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', isVerified: false, adminNote: reason || '' },
    { new: true }
  );
  if (!agency) {
    res.status(404);
    throw new Error('Agency not found');
  }

  if (req.io) {
    await notifications.agencyRejected(req.io, agency.user, reason);
  }

  successResponse(res, 200, 'Agency rejected', agency);
});

// ─── Agency: Get Dashboard Stats ──────────────────────────────────────────────
const getAgencyStats = asyncHandler(async (req, res) => {
  const Caregiver = require('../models/Caregiver');
  const Booking = require('../models/Booking');

  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) {
    return successResponse(res, 200, 'Agency profile not found', null);
  }

  const totalCaregivers = await Caregiver.countDocuments({ agency: agency._id });
  const activeBookings = await Booking.countDocuments({ 
    agency: agency._id, 
    status: { $in: ['accepted', 'assigned', 'ongoing'] }
  });
  
  const recentBookings = await Booking.find({ agency: agency._id })
    .populate('user', 'name email')
    .populate('caregiver', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(5);

  // Fetch Top 3 Caregivers based on earnings
  const topCaregivers = await Caregiver.find({ agency: agency._id })
    .select('name totalEarnings avgRating profileImage completedBookings')
    .sort({ totalEarnings: -1 })
    .limit(3);

  successResponse(res, 200, 'Agency stats fetched', {
    totalCaregivers,
    activeBookings,
    totalEarnings: agency.totalEarnings,
    avgRating: agency.rating,
    isVerified: agency.isVerified,
    recentBookings,
    topCaregivers
  });
});

// ─── Agency: Get Earnings ─────────────────────────────────────────────────────
const getAgencyEarnings = asyncHandler(async (req, res) => {
  const Payment = require('../models/Payment');

  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) {
    res.status(404);
    throw new Error('Agency not found');
  }

  const payments = await Payment.find({ agency: agency._id, status: 'completed' })
    .populate('booking', 'startDate endDate serviceType durationType')
    .sort({ createdAt: -1 });

  const totalEarned = payments.reduce((acc, p) => acc + p.agencyAmount, 0);
  const totalCommission = payments.reduce((acc, p) => acc + p.platformCommission, 0);

  successResponse(res, 200, 'Earnings fetched', {
    totalEarned,
    totalCommission,
    payments,
  });
});

// ─── Agency: Assign/Re-assign Caregiver ───────────────────────────────────────
const assignCaregiver = asyncHandler(async (req, res) => {
  const { bookingId, caregiverId } = req.body;
  const Booking = require('../models/Booking');
  const Caregiver = require('../models/Caregiver');

  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) { res.status(404); throw new Error('Agency not found'); }

  const booking = await Booking.findOne({ _id: bookingId, agency: agency._id });
  if (!booking) { res.status(404); throw new Error('Booking not found in your agency'); }
  if (!['accepted', 'assigned'].includes(booking.status)) {
    res.status(400);
    throw new Error('Only accepted bookings can be assigned');
  }

  const caregiver = await Caregiver.findOne({
    _id: caregiverId,
    agency: agency._id,
    serviceType: booking.serviceType,
  });
  if (!caregiver || !caregiver.isVerified || !caregiver.isActive) {
    res.status(400);
    throw new Error('Selected caregiver is not available or does not belong to your agency');
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

  booking.caregiver = caregiverId;
  booking.status = 'assigned';
  await booking.save();

  const User = require('../models/User');
  await User.findByIdAndUpdate(
    booking.user,
    { assignedCaregiver: caregiver._id },
  );

  // Notify new caregiver
  if (req.io) {
    await createNotification(req.io, {
      recipient: caregiver.user,
      type: 'booking_assigned',
      title: 'New Job Assigned',
      message: `You have been assigned to a new booking (${booking.serviceType}).`,
      data: { bookingId: booking._id }
    });
  }

  successResponse(res, 200, 'Caregiver assigned successfully', booking);
});
const getAgencyReferrals = asyncHandler(async (req, res) => {
  const agency = await Agency.findOne({
    user: req.user._id
  });

  const referrals = await PatientReferral.find({
    assignedAgency: agency._id
  })
    .populate('patient', 'name email')
    .populate('assignedCaregiver', 'name serviceType')
    .populate('hospital', 'hospitalName')
    .populate('booking', '_id status')
    .sort('-createdAt');

  res.json({
    success: true,
    data: referrals
  });
});
const assignReferralCaregiver = asyncHandler(async (req, res) => {
  const { caregiverId } = req.body;

  const referral = await PatientReferral.findById(req.params.id).populate('patient');

  if (!referral) {
    res.status(404);
    throw new Error('Referral not found');
  }

  const agency = await Agency.findOne({ user: req.user._id });

  if (!agency) {
    res.status(404);
    throw new Error('Agency not found');
  }

  const caregiver = await Caregiver.findById(caregiverId);

  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver not found');
  }

  // Auto-create a Booking so the caregiver can clock in/out
  const startDate = referral.dischargeDate || new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30); // Default 30-day care window

  const dailyRate = caregiver.rates?.daily || 0;

  const booking = await Booking.create({
    user: referral.patient._id,
    caregiver: caregiver._id,
    agency: agency._id,
    serviceType: referral.serviceType || 'nurse',
    durationType: 'daily',
    startDate,
    endDate,
    rateApplied: dailyRate,
    totalAmount: 0,          // Hospital referral – payment handled externally
    platformCommission: 0,
    agencyAmount: 0,
    status: 'assigned',      // Directly assignable – no acceptance step
    paymentStatus: 'paid',   // Bypass payment flow for hospital referrals
    isPaid: true,
    specialInstructions: referral.homeCarePlan || '',
  });

  // Link booking back to the referral and advance status
  referral.assignedCaregiver = caregiver._id;
  referral.booking = booking._id;
  referral.status = 'in_progress';
  await referral.save();

  // Notify caregiver
  if (req.io) {
    await createNotification(req.io, {
      recipient: caregiver.user,
      type: 'booking_assigned',
      title: 'New Hospital Referral Job',
      message: `You have been assigned to a hospital referral booking (${booking.serviceType}).`,
      data: { bookingId: booking._id },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Caregiver assigned and booking created successfully',
    referral,
    booking,
  });
});
module.exports = {
  registerAgency,
  getMyAgency,
  updateAgency,
  uploadAgencyDocuments,
  getAllAgencies,
  getAgencyById,
  approveAgency,
  rejectAgency,
  getAgencyEarnings,
  getAgencyStats,
  assignCaregiver,
  getAgencyReferrals,
  assignReferralCaregiver
};
