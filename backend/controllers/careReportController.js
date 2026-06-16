const asyncHandler = require('../utils/asyncHandler');
const CareReport = require('../models/CareReport');
const Caregiver = require('../models/Caregiver');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Patient = require('../models/Patient');
const FamilyMember = require('../models/FamilyMember');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { notifications } = require('../services/notificationService');

// ─── Create Care Report (Caregiver only) ─────────────────────────────────────
// POST /api/care-reports
const createCareReport = asyncHandler(async (req, res) => {
  const {
    bookingId,
    patientId,
    patientCondition,
    activitiesPerformed,
    vitals,
    remarks,
    reportDate,
  } = req.body;

  if (!bookingId || !patientId || !patientCondition) {
    res.status(400);
    throw new Error('bookingId, patientId, and patientCondition are required');
  }

  // Resolve the caregiver profile for this user
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(403);
    throw new Error('Only caregivers can submit care reports');
  }

  // Verify this caregiver is assigned to the booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (String(booking.caregiver) !== String(caregiver._id)) {
    res.status(403);
    throw new Error('You are not assigned to this booking');
  }

  if (!['assigned', 'ongoing', 'completed'].includes(booking.status)) {
    res.status(400);
    throw new Error('Care reports can only be submitted for active or completed bookings');
  }

  // Verify patient exists
  const patient = await User.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Handle file uploads → Cloudinary
  let attachments = [];
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, {
        folder: 'careconnect/care-reports',
        resource_type: 'image',
      }).then((result) => ({
        url: result.url,
        publicId: result.publicId,
        name: file.originalname,
      }))
    );
    attachments = await Promise.all(uploadPromises);
  }

  // Parse activitiesPerformed if sent as a JSON string (FormData)
  let activities = activitiesPerformed;
  if (typeof activitiesPerformed === 'string') {
    try { activities = JSON.parse(activitiesPerformed); } catch { activities = [activitiesPerformed]; }
  }

  // Parse vitals if sent as a JSON string (FormData)
  let parsedVitals = vitals;
  if (typeof vitals === 'string') {
    try { parsedVitals = JSON.parse(vitals); } catch { parsedVitals = {}; }
  }

  const report = await CareReport.create({
    caregiver: caregiver._id,
    booking: bookingId,
    patient: patientId,
    submittedBy: req.user._id,
    reportDate: reportDate || Date.now(),
    patientCondition,
    activitiesPerformed: activities || [],
    vitals: parsedVitals || {},
    remarks: remarks || '',
    attachments,
  });

  // ── Notify patient and any linked family members ──────────────────────────
  const io = req.io;

  // Notify the patient directly
  notifications.careReportSubmitted(io, patient._id, report._id);

  // Notify all linked family members who can receive health reports
  const familyMembers = await FamilyMember.find({
    patient: patientId,
    canReceiveHealthReports: true,
  });
  for (const fm of familyMembers) {
    notifications.careReportSubmitted(io, fm.user, report._id);
  }

  const populated = await report.populate([
    { path: 'caregiver', select: 'name profileImage' },
    { path: 'patient', select: 'name profileImage' },
    { path: 'booking', select: 'serviceType startDate endDate' },
  ]);

  successResponse(res, 201, 'Care report submitted successfully', populated);
});

// ─── Get Reports by Patient ───────────────────────────────────────────────────
// GET /api/care-reports/patient/:patientId
const getReportsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { startDate, endDate, condition, page, limit } = req.query;

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

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
      assignedCaregiver: userExists.assignedCaregiver,
    };
  }

  const patientUserId = patient.user?._id || patient.user;
  const patientDocId = patient._id;

  // ── Access Control ────────────────────────────────────────────────────────
  const isAdmin = req.user.role === 'admin';
  const isOwner = String(patientUserId) === String(req.user._id);
  const isDoctor = req.user.role === 'doctor';

  let isCaregiver = false;
  if (req.user.role === 'caregiver') {
    const cg = await Caregiver.findOne({ user: req.user._id });
    if (cg && String(patient.assignedCaregiver) === String(cg._id)) isCaregiver = true;
  }

  let isFamily = false;
  if (req.user.role === 'family') {
    const orQuery = [{ patient: patientUserId }];
    if (patientDocId) orQuery.push({ patient: patientDocId });
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      $or: orQuery,
      canReceiveHealthReports: true,
    });
    if (fm) isFamily = true;
  }

  if (!isAdmin && !isOwner && !isDoctor && !isCaregiver && !isFamily) {
    res.status(403);
    throw new Error('Access denied to patient care reports');
  }

  // ── Build Filter ──────────────────────────────────────────────────────────
  const filter = { patient: patientUserId };
  if (condition) filter.patientCondition = condition;
  if (startDate || endDate) {
    filter.reportDate = {};
    if (startDate) filter.reportDate.$gte = new Date(startDate);
    if (endDate) filter.reportDate.$lte = new Date(endDate);
  }

  const { docs, pagination } = await paginate(CareReport, filter, {
    page,
    limit: limit || 10,
    populate: [
      { path: 'caregiver', select: 'name profileImage serviceType' },
      { path: 'booking', select: 'serviceType startDate endDate' },
      { path: 'submittedBy', select: 'name' },
    ],
    sort: { reportDate: -1 },
  });

  paginatedResponse(res, 200, 'Care reports fetched', docs, pagination);
});

// ─── Get Reports by Booking ───────────────────────────────────────────────────
// GET /api/care-reports/booking/:bookingId
const getReportsByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { condition, page, limit } = req.query;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // ── Access Control ────────────────────────────────────────────────────────
  const isAdmin = req.user.role === 'admin';
  const isOwner = String(booking.user) === String(req.user._id);
  const isDoctor = req.user.role === 'doctor';

  let isCaregiver = false;
  if (req.user.role === 'caregiver') {
    const cg = await Caregiver.findOne({ user: req.user._id });
    if (cg && String(booking.caregiver) === String(cg._id)) isCaregiver = true;
  }

  let isFamily = false;
  if (req.user.role === 'family' && booking.user) {
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      patient: booking.user,
      canReceiveHealthReports: true,
    });
    if (fm) isFamily = true;
  }

  if (!isAdmin && !isOwner && !isDoctor && !isCaregiver && !isFamily) {
    res.status(403);
    throw new Error('Access denied to booking care reports');
  }

  // ── Build Filter ──────────────────────────────────────────────────────────
  const filter = { booking: bookingId };
  if (condition) filter.patientCondition = condition;

  const { docs, pagination } = await paginate(CareReport, filter, {
    page,
    limit: limit || 10,
    populate: [
      { path: 'caregiver', select: 'name profileImage serviceType' },
      { path: 'patient', select: 'name profileImage' },
      { path: 'submittedBy', select: 'name' },
    ],
    sort: { reportDate: -1 },
  });

  paginatedResponse(res, 200, 'Booking care reports fetched', docs, pagination);
});

// ─── Update Care Report ───────────────────────────────────────────────────────
// PUT /api/care-reports/:id
const updateCareReport = asyncHandler(async (req, res) => {
  const report = await CareReport.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error('Care report not found');
  }

  // Only the caregiver who submitted it may edit
  if (String(report.submittedBy) !== String(req.user._id)) {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only the submitting caregiver can update this report');
    }
  }

  const { patientCondition, activitiesPerformed, vitals, remarks, reportDate } = req.body;

  let activities = activitiesPerformed;
  if (typeof activitiesPerformed === 'string') {
    try { activities = JSON.parse(activitiesPerformed); } catch { activities = [activitiesPerformed]; }
  }

  let parsedVitals = vitals;
  if (typeof vitals === 'string') {
    try { parsedVitals = JSON.parse(vitals); } catch { parsedVitals = {}; }
  }

  if (patientCondition !== undefined) report.patientCondition = patientCondition;
  if (activities !== undefined) report.activitiesPerformed = activities;
  if (parsedVitals !== undefined) report.vitals = parsedVitals;
  if (remarks !== undefined) report.remarks = remarks;
  if (reportDate !== undefined) report.reportDate = reportDate;

  // Handle new file uploads
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, {
        folder: 'careconnect/care-reports',
        resource_type: 'image',
      }).then((result) => ({
        url: result.url,
        publicId: result.publicId,
        name: file.originalname,
      }))
    );
    const newAttachments = await Promise.all(uploadPromises);
    report.attachments = [...report.attachments, ...newAttachments];
  }

  await report.save();

  // Notify patient about the update
  const patient = await User.findById(report.patient).select('_id');
  if (patient) {
    notifications.careReportUpdated(req.io, patient._id, report._id);

    const familyMembers = await FamilyMember.find({
      patient: patient._id,
      canReceiveHealthReports: true,
    });
    for (const fm of familyMembers) {
      notifications.careReportUpdated(req.io, fm.user, report._id);
    }
  }

  const populated = await report.populate([
    { path: 'caregiver', select: 'name profileImage serviceType' },
    { path: 'patient', select: 'name profileImage' },
    { path: 'booking', select: 'serviceType startDate endDate' },
  ]);

  successResponse(res, 200, 'Care report updated successfully', populated);
});

module.exports = {
  createCareReport,
  getReportsByPatient,
  getReportsByBooking,
  updateCareReport,
};
