const asyncHandler = require('../utils/asyncHandler');
const FamilyMember = require('../models/FamilyMember');
const User = require('../models/User');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');

const getOrCreateFamilyMember = async (user) => {
  let fm = await FamilyMember.findOne({ user: user._id });
  if (!fm && user.role === 'family') {
    fm = await FamilyMember.create({
      user: user._id,
      name: user.name,
      relationship: 'other',
    });
  }
  return fm;
};

// ─── Create Family Member Profile ─────────────────────────────────────────────
const createFamilyProfile = asyncHandler(async (req, res) => {
  const { name, phone, relationship, patientId, canReceiveHealthReports, canReceiveEmergencyAlerts, canChatWithCaregiver, isEmergencyContact } = req.body;

  let familyMember = await FamilyMember.findOne({ user: req.user._id });
  if (familyMember) {
    res.status(400);
    throw new Error('Family Member profile already exists');
  }

  familyMember = new FamilyMember({
    user: req.user._id,
    name,
    phone,
    relationship,
    patient: patientId || undefined,
    canReceiveHealthReports: canReceiveHealthReports ?? true,
    canReceiveEmergencyAlerts: canReceiveEmergencyAlerts ?? true,
    canChatWithCaregiver: canChatWithCaregiver ?? true,
    isEmergencyContact: isEmergencyContact ?? false,
  });

  await familyMember.save();

  // If a patient was linked, add this family member to the user's familyMembers array
  if (patientId) {
    await User.findByIdAndUpdate(patientId, { $addToSet: { familyMembers: familyMember._id } });
  }

  // Update user role if needed
  if (req.user.role === 'user') {
    await User.findByIdAndUpdate(req.user._id, { role: 'family' });
  }

  successResponse(res, 201, 'Family Member profile created', familyMember);
});

// ─── Get My Family Profile ────────────────────────────────────────────────────
const getMyFamilyProfile = asyncHandler(async (req, res) => {
  let familyMember = await getOrCreateFamilyMember(req.user);
  if (familyMember) {
    familyMember = await FamilyMember.findById(familyMember._id).populate('patient', 'name profileImage gender dateOfBirth');
  }

  if (!familyMember) {
    res.status(404);
    throw new Error('Family Member profile not found');
  }

  successResponse(res, 200, 'Family Member profile fetched', familyMember);
});

// ─── Update Family Profile ────────────────────────────────────────────────────
const updateFamilyProfile = asyncHandler(async (req, res) => {
  const familyMember = await getOrCreateFamilyMember(req.user);
  
  if (!familyMember) {
    res.status(404);
    throw new Error('Family Member profile not found');
  }

  const updatableFields = ['name', 'phone', 'relationship', 'canReceiveHealthReports', 'canReceiveEmergencyAlerts', 'canChatWithCaregiver', 'isEmergencyContact'];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) familyMember[field] = req.body[field];
  });

  if (req.body.patientId && String(req.body.patientId) !== String(familyMember.patient)) {
    // Remove from old patient
    if (familyMember.patient) {
      await User.findByIdAndUpdate(familyMember.patient, { $pull: { familyMembers: familyMember._id } });
    }
    // Add to new patient
    familyMember.patient = req.body.patientId;
    await User.findByIdAndUpdate(req.body.patientId, { $addToSet: { familyMembers: familyMember._id } });
  }

  const updatedFamilyMember = await familyMember.save();
  successResponse(res, 200, 'Family Member profile updated', updatedFamilyMember);
});

// ─── Get All Family Members (Admin) ───────────────────────────────────────────
const getAllFamilyMembers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.patientId) filter.patient = req.query.patientId;
  
  const { docs, pagination } = await paginate(FamilyMember, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: { path: 'patient', select: 'name' },
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'Family Members fetched', docs, pagination);
});

// ─── Link Patient to Family Member ──────────────────────────────────────────────
const linkPatient = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Access code is required');
  }

  const fm = await getOrCreateFamilyMember(req.user);
  if (!fm) {
    res.status(404);
    throw new Error('Family Member profile not found');
  }

  if (fm.patient) {
    res.status(400);
    throw new Error('You are already linked to a patient. Please contact support to change linked patients.');
  }

  // Find user (patient) with valid non-expired code
  const patient = await User.findOne({
    familyAccessCode: code.toUpperCase().trim(),
    familyAccessCodeExpires: { $gt: new Date() }
  });

  if (!patient) {
    res.status(400);
    throw new Error('Invalid or expired family access code');
  }

  // Link patient and family member
  if (!patient.familyMembers.includes(fm._id)) {
    patient.familyMembers.push(fm._id);
  }

  // Expire the code
  patient.familyAccessCode = undefined;
  patient.familyAccessCodeExpires = undefined;
  await patient.save();

  fm.patient = patient._id;
  await fm.save();

  successResponse(res, 200, 'Successfully linked to patient', fm);
});

// ─── Generate Family Access Code (Patient Side) ──────────────────────────────
const generateCode = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const code = `CARE-${randomCode}`;

  user.familyAccessCode = code;
  user.familyAccessCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  successResponse(res, 200, 'Access code generated successfully', {
    code: user.familyAccessCode,
    expiresAt: user.familyAccessCodeExpires,
  });
});

// ─── Get My Linked Patient (Family Side) ──────────────────────────────────────
const getMyPatient = asyncHandler(async (req, res) => {
  const fm = await getOrCreateFamilyMember(req.user);
  if (!fm) {
    res.status(404);
    throw new Error('Family Member profile not found');
  }

  if (!fm.patient) {
    res.status(400);
    throw new Error('No patient is linked to this family account');
  }

  const patient = await User.findById(fm.patient);
  if (!patient) {
    res.status(404);
    throw new Error('Linked patient profile not found');
  }

  successResponse(res, 200, 'Linked patient fetched successfully', patient);
});

// ─── Get Family Dashboard Stats ────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const familyMember = await getOrCreateFamilyMember(req.user);
  if (!familyMember || !familyMember.patient) {
    return successResponse(res, 200, 'Dashboard stats', { patientLinked: false });
  }

  const patientId = familyMember.patient;
  const patient = await User.findById(patientId);

  // 1. Next Upcoming Booking
  const Booking = require('../models/Booking');
  const nextBooking = await Booking.findOne({
    user: patient?._id,
    status: { $in: ['assigned', 'ongoing'] }
  })
    .sort({ startDate: 1, startTime: 1 })
    .populate('caregiver', 'name profileImage');

  // 2. Recent Abnormal Health Logs
  const HealthLog = require('../models/HealthLog');
  const recentHealthAlerts = await HealthLog.countDocuments({
    patient: patientId,
    isAbnormal: true,
    logDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  // 3. Pending Medications Today
  const MedicationLog = require('../models/MedicationLog');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pendingMedications = await MedicationLog.countDocuments({
    patient: patientId,
    status: 'pending',
    scheduledTime: { $gte: today, $lt: tomorrow }
  });

  // 4. Active Emergencies
  const EmergencyIncident = require('../models/EmergencyIncident');
  const activeEmergencies = await EmergencyIncident.countDocuments({
    patient: patientId,
    status: { $in: ['active', 'acknowledged', 'responding'] }
  });

  successResponse(res, 200, 'Dashboard stats fetched', {
    patientLinked: true,
    patientId,
    nextBooking,
    recentHealthAlerts,
    pendingMedications,
    activeEmergencies
  });
});

module.exports = {
  createFamilyProfile,
  getMyFamilyProfile,
  updateFamilyProfile,
  getAllFamilyMembers,
  linkPatient,
  getDashboardStats,
  generateCode,
  getMyPatient,
};
