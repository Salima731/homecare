const asyncHandler = require('../utils/asyncHandler');
const AttendanceRecord = require('../models/AttendanceRecord');
const Caregiver = require('../models/Caregiver');
const Booking = require('../models/Booking');
const Patient = require('../models/Patient');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { createNotification } = require('../services/notificationService');

// ─── Helper: Haversine Distance (meters) ─────────────────────────────────────
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── GPS Check-In ─────────────────────────────────────────────────────────────
// POST /api/attendance/checkin
const checkIn = asyncHandler(async (req, res) => {
  const { bookingId, lat, lng, address, selfieUrl, selfiePublicId, method } = req.body;

  if (!bookingId || !lat || !lng) {
    res.status(400);
    throw new Error('bookingId, lat and lng are required');
  }

  // Get caregiver profile
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  // Validate booking belongs to this caregiver
  const booking = await Booking.findOne({
    _id: bookingId,
    caregiver: caregiver._id,
    status: { $in: ['assigned', 'ongoing'] },
  }).populate('user', '_id name');

  if (!booking) {
    res.status(404);
    throw new Error('Active booking not found for this caregiver');
  }

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await AttendanceRecord.findOne({
    caregiver: caregiver._id,
    booking: bookingId,
    date: { $gte: today, $lt: tomorrow },
  });

  if (existing?.checkIn?.time) {
    res.status(400);
    throw new Error('Already checked in for today on this booking');
  }

  // Geofence validation — check if within radius of booking address
  // Using booking address city as a soft check (full geo requires booking to store coords)
  const geofenceRadius = 500; // 500 metres default
  let isWithinGeofence = true; // Default true since we don't store booking GPS coords yet

  // Update caregiver's currentLocation
  await Caregiver.findByIdAndUpdate(caregiver._id, {
    currentLocation: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)], updatedAt: new Date() },
  });

  // Determine if late (compare with booking startTime)
  const now = new Date();
  let status = 'present';
  let lateByMinutes = 0;

  if (booking.startTime) {
    const [startHour, startMin] = booking.startTime.split(':').map(Number);
    const expectedStart = new Date(now);
    expectedStart.setHours(startHour, startMin, 0, 0);
    const diffMs = now - expectedStart;
    if (diffMs > 15 * 60 * 1000) {
      // More than 15 min late
      lateByMinutes = Math.round(diffMs / 60000);
      status = 'late';
    }
  }

  let record;
  if (existing) {
    // Update existing record
    existing.checkIn = {
      time: now,
      location: { lat, lng, address: address || '' },
      selfieUrl: selfieUrl || '',
      selfiePublicId: selfiePublicId || '',
      isWithinGeofence,
      faceVerified: method === 'face',
      method: method || 'gps',
    };
    existing.status = status;
    existing.lateByMinutes = lateByMinutes;
    record = await existing.save();
  } else {
    record = await AttendanceRecord.create({
      caregiver: caregiver._id,
      booking: bookingId,
      patient: booking.patient || undefined,
      date: new Date(),
      checkIn: {
        time: now,
        location: { lat, lng, address: address || '' },
        selfieUrl: selfieUrl || '',
        selfiePublicId: selfiePublicId || '',
        isWithinGeofence,
        faceVerified: method === 'face',
        method: method || 'gps',
      },
      status,
      lateByMinutes,
      geofenceRadius,
    });
  }

  // Update caregiver attendance stats
  await Caregiver.findByIdAndUpdate(caregiver._id, {
    $inc: { 'attendanceStats.totalDays': 1, ...(status === 'late' ? { 'attendanceStats.lateDays': 1 } : {}) },
  });

  // Notify booking user (patient/user) that caregiver has checked in
  if (req.io && booking.user?._id) {
    req.io.to(`user_${booking.user._id}`).emit('caregiver_checkedin', {
      caregiverId: caregiver._id,
      caregiverName: caregiver.name,
      bookingId,
      time: now,
      location: { lat, lng, address },
      status,
      lateByMinutes,
    });

    await createNotification(req.io, {
      recipient: booking.user._id,
      type: 'caregiver_arrived',
      title: `${caregiver.name} has checked in`,
      message: status === 'late'
        ? `${caregiver.name} checked in ${lateByMinutes} minutes late.`
        : `${caregiver.name} has arrived and checked in on time.`,
      data: { bookingId, attendanceId: record._id },
    });
  }

  successResponse(res, 201, `Check-in recorded (${status})`, record);
});

// ─── GPS Check-Out ─────────────────────────────────────────────────────────────
// POST /api/attendance/checkout
const checkOut = asyncHandler(async (req, res) => {
  const { bookingId, lat, lng, address, selfieUrl, selfiePublicId } = req.body;

  if (!bookingId || !lat || !lng) {
    res.status(400);
    throw new Error('bookingId, lat and lng are required');
  }

  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  // Find today's attendance record
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const record = await AttendanceRecord.findOne({
    caregiver: caregiver._id,
    booking: bookingId,
    date: { $gte: today, $lt: tomorrow },
  });

  if (!record) {
    res.status(404);
    throw new Error('No check-in found for today on this booking — please check in first');
  }

  if (record.checkOut?.time) {
    res.status(400);
    throw new Error('Already checked out for today');
  }

  const now = new Date();
  const checkInTime = record.checkIn?.time || now;
  const workedMs = now - checkInTime;
  const workedHours = parseFloat((workedMs / 3600000).toFixed(2));

  record.checkOut = {
    time: now,
    location: { lat, lng, address: address || '' },
    selfieUrl: selfieUrl || '',
    selfiePublicId: selfiePublicId || '',
    isWithinGeofence: true,
    faceVerified: false,
  };
  record.workedHours = workedHours;

  await record.save();

  // Update caregiver currentLocation
  await Caregiver.findByIdAndUpdate(caregiver._id, {
    currentLocation: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)], updatedAt: now },
  });

  // Notify user
  const booking = await Booking.findById(bookingId).populate('user', '_id name');
  if (req.io && booking?.user?._id) {
    req.io.to(`user_${booking.user._id}`).emit('caregiver_checkedout', {
      caregiverId: caregiver._id,
      caregiverName: caregiver.name,
      bookingId,
      time: now,
      workedHours,
    });

    await createNotification(req.io, {
      recipient: booking.user._id,
      type: 'caregiver_left',
      title: `${caregiver.name} has checked out`,
      message: `${caregiver.name} completed ${workedHours}h of care today.`,
      data: { bookingId, attendanceId: record._id },
    });
  }

  successResponse(res, 200, `Check-out recorded — ${workedHours}h worked`, record);
});

// ─── Get Attendance History (Caregiver) ──────────────────────────────────────
// GET /api/attendance/my
const getMyAttendance = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  const filter = { caregiver: caregiver._id };
  if (req.query.bookingId) filter.booking = req.query.bookingId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
  }

  const { docs, pagination } = await paginate(AttendanceRecord, filter, {
    page: req.query.page,
    limit: req.query.limit || 30,
    populate: { path: 'booking', select: 'serviceType startDate endDate user' },
    sort: { date: -1 },
  });

  paginatedResponse(res, 200, 'Attendance history fetched', docs, pagination);
});

// ─── Get Attendance for a Booking ────────────────────────────────────────────
// GET /api/attendance/booking/:bookingId
const getBookingAttendance = asyncHandler(async (req, res) => {
  const records = await AttendanceRecord.find({ booking: req.params.bookingId })
    .populate('caregiver', 'name profileImage')
    .sort({ date: -1 });

  const summary = {
    totalDays: records.length,
    presentDays: records.filter((r) => r.status === 'present').length,
    lateDays: records.filter((r) => r.status === 'late').length,
    absentDays: records.filter((r) => r.status === 'absent').length,
    totalWorkedHours: parseFloat(records.reduce((acc, r) => acc + (r.workedHours || 0), 0).toFixed(2)),
  };

  successResponse(res, 200, 'Booking attendance records fetched', { records, summary });
});

// ─── Get All Attendance (Admin/Agency) ────────────────────────────────────────
// GET /api/attendance
const getAllAttendance = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'agency') {
    const Agency = require('../models/Agency');
    const agency = await Agency.findOne({ user: req.user._id });
    if (agency) {
      const agencyCaregivers = await Caregiver.find({ agency: agency._id }).select('_id');
      filter.caregiver = { $in: agencyCaregivers.map((c) => c._id) };
    }
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.caregiverId) filter.caregiver = req.query.caregiverId;

  const { docs, pagination } = await paginate(AttendanceRecord, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: 'caregiver', select: 'name profileImage' },
      { path: 'booking', select: 'serviceType startDate' },
    ],
    sort: { date: -1 },
  });

  paginatedResponse(res, 200, 'All attendance records fetched', docs, pagination);
});

// ─── Admin Approve Attendance ─────────────────────────────────────────────────
// PUT /api/attendance/:id/approve
const approveAttendance = asyncHandler(async (req, res) => {
  const record = await AttendanceRecord.findByIdAndUpdate(
    req.params.id,
    { adminApproved: true, note: req.body.note || '' },
    { new: true }
  );

  if (!record) {
    res.status(404);
    throw new Error('Attendance record not found');
  }

  successResponse(res, 200, 'Attendance approved', record);
});

// ─── Get Patient Attendance (Family/Patient/Admin) ────────────────────────────
// GET /api/attendance/patient/:patientId
const getPatientAttendance = asyncHandler(async (req, res) => {
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
    throw new Error('Access denied to patient attendance records');
  }

  const filter = { patient: patientUserId };
  if (req.query.status) filter.status = req.query.status;

  const { docs, pagination } = await paginate(AttendanceRecord, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: { path: 'caregiver', select: 'name profileImage' },
    sort: { date: -1 },
  });

  paginatedResponse(res, 200, 'Patient attendance fetched', docs, pagination);
});

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getBookingAttendance,
  getAllAttendance,
  approveAttendance,
  getPatientAttendance,
};
