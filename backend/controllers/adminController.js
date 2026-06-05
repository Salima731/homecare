const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Agency = require('../models/Agency');
const Hospital = require('../models/Hospital');
const Caregiver = require('../models/Caregiver');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Setting = require('../models/Setting');
const Doctor = require('../models/Doctor');
const { successResponse } = require('../utils/responseHandler');
const { setConfig } = require('../utils/configStore');
const { createNotification } = require('../services/notificationService');

// ─── Platform Analytics ───────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalAgencies,
    pendingAgencies,
    totalCaregivers,
    totalBookings,
    completedBookings,
    pendingBookings,
    totalRevenue,
    openComplaints,
  ] = await Promise.all([
    User.countDocuments(),
    Agency.countDocuments(),
    Agency.countDocuments({ status: 'pending' }),
    Caregiver.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: 'pending' }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$platformCommission' } } },
    ]),
    Complaint.countDocuments({ status: 'open' }),
  ]);

  const platformRevenue = totalRevenue[0]?.total || 0;

  // Monthly bookings for chart (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [monthlyBookings, pendingVerifications, recentComplaints] = await Promise.all([
    Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$platformCommission' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Agency.find({ status: 'pending' })
      .populate('user', 'name email')
      .limit(5)
      .sort({ createdAt: -1 }),
    Complaint.find({ status: 'open', priority: 'high' })
      .populate('raisedBy', 'name')
      .populate('against.entityId', 'name agencyName')
      .limit(5)
      .sort({ createdAt: -1 })
  ]);

  successResponse(res, 200, 'Analytics fetched', {
    overview: {
      totalUsers,
      totalAgencies,
      pendingAgencies,
      totalCaregivers,
      totalBookings,
      completedBookings,
      pendingBookings,
      platformRevenue,
      openComplaints,
    },
    monthlyBookings,
    pendingVerifications: pendingVerifications.map(a => ({
      _id: a._id,
      name: a.agencyName,
      type: 'agency',
      createdAt: a.createdAt,
      user: a.user
    })),
    recentComplaints
  });
});

// ─── Get/Update Platform Commission ──────────────────────────────────────────
const getCommission = asyncHandler(async (req, res) => {
  let setting = await Setting.findOne({ key: 'PLATFORM_COMMISSION' });
  
  if (!setting) {
    const rate = parseFloat(process.env.PLATFORM_COMMISSION || '10');
    setting = await Setting.create({ key: 'PLATFORM_COMMISSION', value: rate });
  }

  successResponse(res, 200, 'Platform commission', {
    commissionRate: setting.value,
  });
});

const getHospitals = asyncHandler(async (req, res) => {
  const hospitals = await Hospital.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  successResponse(
    res,
    200,
    "Hospitals fetched",
    hospitals
  );
});
const updateCommission = asyncHandler(async (req, res) => {
  const { rate } = req.body;
  if (rate < 0 || rate > 100) {
    res.status(400); throw new Error('Commission rate must be between 0 and 100');
  }

  const setting = await Setting.findOneAndUpdate(
    { key: 'PLATFORM_COMMISSION' },
    { value: rate, updatedBy: req.user._id },
    { upsert: true, new: true }
  );

  // Update cache
  setConfig('PLATFORM_COMMISSION', rate);
  // Update process.env for current session as well
  process.env.PLATFORM_COMMISSION = rate.toString();

  successResponse(res, 200, 'Commission rate updated successfully', {
    commissionRate: setting.value,
  });
});

// ─── Agency Management ───────────────────────────────────────────────────────
const getAgencies = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  
  const agencies = await Agency.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  successResponse(res, 200, 'Agencies fetched', agencies);
});

const updateAgencyStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) {
    res.status(400); throw new Error('Invalid status');
  }

  const agency = await Agency.findByIdAndUpdate(
    req.params.id,
    { status, adminNote: adminNote || '' },
    { new: true }
  );

  if (!agency) { res.status(404); throw new Error('Agency not found'); }

  // If approved, set isVerified to true as well
  if (status === 'approved') {
    agency.isVerified = true;
    await agency.save();
  }

  successResponse(res, 200, `Agency status updated to ${status}`, agency);
});

// ─── Verification Flow ────────────────────────────────────────────────────────
const getPendingVerifications = asyncHandler(async (req, res) => {
  const [pendingAgencies, pendingHospitals] = await Promise.all([
    Agency.find({ status: 'pending' }).populate('user', 'name email'),
    Hospital.find({ status: 'pending' }).populate('user', 'name email'),
  ]);
  
  const formattedAgencies = pendingAgencies.map(agency => ({
    _id: agency._id,
    name: agency.agencyName,
    email: agency.user?.email,
    type: 'agency',
    createdAt: agency.createdAt,
    documents: agency.documents
  }));

  const formattedHospitals = pendingHospitals.map(hospital => ({
    _id: hospital._id,
    name: hospital.hospitalName,
    email: hospital.user?.email,
    type: 'hospital',
    createdAt: hospital.createdAt,
    documents: hospital.documents
  }));

  const combined = [...formattedAgencies, ...formattedHospitals]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  successResponse(res, 200, 'Pending verifications fetched', combined);
});

const verifyEntity = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { status, remarks } = req.body;

  const dbStatus = status === 'active' ? 'approved' : 'rejected';

  if (type === 'agency') {
    const agency = await Agency.findByIdAndUpdate(
      id,
      { status: dbStatus, adminNote: remarks || '', isVerified: dbStatus === 'approved' },
      { new: true }
    );
    if (!agency) { res.status(404); throw new Error('Agency not found'); }
    return successResponse(res, 200, `Agency ${dbStatus} successfully`, agency);
  }

  if (type === 'hospital') {
    const hospital = await Hospital.findByIdAndUpdate(
      id,
      { status: dbStatus, adminNote: remarks || '', isVerified: dbStatus === 'approved' },
      { new: true }
    );
    if (!hospital) { res.status(404); throw new Error('Hospital not found'); }

    // Notify hospital user
    if (req.io) {
      await createNotification(req.io, {
        recipient: hospital.user,
        type: dbStatus === 'approved' ? 'agency_approved' : 'agency_rejected',
        title: dbStatus === 'approved' ? '✅ Hospital Approved' : '❌ Hospital Rejected',
        message: dbStatus === 'approved'
          ? 'Your hospital registration has been approved. You can now access the full dashboard.'
          : `Your hospital registration was rejected. Reason: ${remarks || 'No reason provided.'}`,
        data: { hospitalId: hospital._id },
      });
    }

    return successResponse(res, 200, `Hospital ${dbStatus} successfully`, hospital);
  }

  res.status(400);
  throw new Error('Invalid entity type. Must be \'agency\' or \'hospital\'.');
});

// ─── User Management ──────────────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  const filter = {};
  
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 });

  successResponse(res, 200, 'Users fetched', { users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const isBanned = status === 'banned';
  
  const user = await User.findByIdAndUpdate(
    req.params.id, 
    { isBanned }, 
    { new: true }
  ).select('-password');

  if (!user) { res.status(404); throw new Error('User not found'); }

  successResponse(res, 200, `User ${isBanned ? 'banned' : 'activated'} successfully`, user);
});

// ─── Complaint Management ─────────────────────────────────────────────────────
const getAllComplaints = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const complaints = await Complaint.find(filter)
    .populate('raisedBy', 'name email')
    .populate('against.entityId', 'name agencyName')
    .sort({ createdAt: -1 });

  successResponse(res, 200, 'Complaints fetched', complaints);
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  
  const updateData = { status, adminNote: adminNote || '' };
  
  if (status === 'resolved') {
    updateData.resolvedBy = req.user._id;
    updateData.resolvedAt = Date.now();
  }

  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  ).populate('raisedBy', 'name email').populate('against.entityId', 'name agencyName');

  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }
  
  // Notify the user who raised the complaint
  if (req.io) {
    const title = status === 'resolved' ? 'Complaint Resolved' : 'Complaint Status Updated';
    const message = status === 'resolved' 
      ? `Your complaint about ${complaint.subject} has been resolved. Note: ${adminNote}`
      : `Your complaint about ${complaint.subject} is now ${status.replace('_', ' ')}.`;
      
    await createNotification(req.io, {
      recipient: complaint.raisedBy._id,
      type: status === 'resolved' ? 'complaint_resolved' : 'complaint_updated',
      title,
      message,
      data: { complaintId: complaint._id }
    });
  }

  successResponse(res, 200, `Complaint status updated to ${status}`, complaint);
});

// ─── Platform Settings ────────────────────────────────────────────────────────
const getPlatformSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find({});
  // Convert array to object for easier frontend use
  const settingsObj = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  // Ensure default commission exists if not in DB
  if (!settingsObj.PLATFORM_COMMISSION) {
    settingsObj.PLATFORM_COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION || '10');
  }

  successResponse(res, 200, 'Platform settings fetched', settingsObj);
});

const updatePlatformSettings = asyncHandler(async (req, res) => {
  const updates = req.body; // Expecting { KEY: value, ... }
  
  const promises = Object.entries(updates).map(([key, value]) => {
    return Setting.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
  });

  await Promise.all(promises);

  // Special handling for commission if it was updated
  if (updates.PLATFORM_COMMISSION) {
    process.env.PLATFORM_COMMISSION = updates.PLATFORM_COMMISSION.toString();
  }

  successResponse(res, 200, 'Platform settings updated successfully');
});

// ─── Master Booking Management ────────────────────────────────────────────────
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  
  const bookings = await Booking.find(filter)
    .populate('user', 'name email')
    .populate('agency', 'agencyName')
    .populate('caregiver', 'name')
    .sort({ createdAt: -1 });

  successResponse(res, 200, 'All platform bookings fetched', bookings);
});

// ─── Master Transaction History ───────────────────────────────────────────────
const getAllPayments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const payments = await Payment.find(filter)
    .populate('user', 'name email')
    .populate('agency', 'agencyName')
    .populate('booking', 'serviceType startDate status')
    .sort({ createdAt: -1 });

  successResponse(res, 200, 'All platform transactions fetched', payments);
});
const updateHospitalStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const hospital = await Hospital.findByIdAndUpdate(
    req.params.id,
    {
      status,
      isVerified: status === "approved"
    },
    { new: true }
  );

  successResponse(
    res,
    200,
    "Hospital updated",
    hospital
  );
});
const getCaregivers = asyncHandler(async (req, res) => {
  const caregivers = await Caregiver.find()
    .populate('user', 'name email')
    .populate('agency', 'agencyName');

  successResponse(
    res,
    200,
    'Caregivers fetched',
    caregivers
  );
});
const updateCaregiverStatus = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findById(
    req.params.id
  );

  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver not found');
  }

  caregiver.isActive = req.body.isActive;

  await caregiver.save();

  successResponse(
    res,
    200,
    'Caregiver status updated',
    caregiver
  );
});

// ─── Master Doctor Management ──────────────────────────────────────────────────
const getAllDoctors = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const doctors = await Doctor.find(filter)
    .populate('user', 'email')
    .populate('hospital', 'hospitalName')
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  successResponse(res, 200, 'All platform doctors fetched', doctors);
});

module.exports = { 
  getAnalytics, getCommission, updateCommission, 
  getAgencies, updateAgencyStatus,
  getPendingVerifications, verifyEntity,
  getAllUsers, updateUserStatus,
  getAllComplaints, updateComplaintStatus,
  getPlatformSettings, updatePlatformSettings,
  getAllBookings, getAllPayments, getHospitals, updateHospitalStatus,
  getAllDoctors,
  getCaregivers,
  updateCaregiverStatus
};
