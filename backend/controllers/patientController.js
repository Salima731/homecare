const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { uploadAvatar, deleteFromCloudinary } = require('../services/cloudinaryService');

// ─── Create / Upsert Patient Profile ─────────────────────────────────────────
// POST /api/patients/profile
const createPatientProfile = asyncHandler(async (req, res) => {
  const {
    name, dateOfBirth, gender, bloodGroup, allergies,
    chronicConditions, emergencyContact, insuranceProvider,
    insurancePolicyNumber, address
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name) user.name = name;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (gender) user.gender = gender;
  if (bloodGroup) user.bloodGroup = bloodGroup;
  if (allergies) user.allergies = JSON.parse(allergies);
  if (chronicConditions) user.chronicConditions = JSON.parse(chronicConditions);
  if (emergencyContact) user.emergencyContact = JSON.parse(emergencyContact);
  if (insuranceProvider) user.insuranceProvider = insuranceProvider;
  if (insurancePolicyNumber) user.insurancePolicyNumber = insurancePolicyNumber;
  if (address) user.address = JSON.parse(address);

  if (req.file) {
    const { url, publicId } = await uploadAvatar(req.file.buffer);
    user.profileImage = { url, publicId };
  }

  await user.save();

  successResponse(res, 201, 'Patient profile created', user);
});

// ─── Get My Patient Profile ───────────────────────────────────────────────────
// GET /api/patients/profile
const getMyPatientProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('assignedCaregiver', 'name profileImage')
    .populate('assignedHospital', 'name')
    .populate('assignedDoctor', 'name')
    .populate('familyMembers', 'name relationship phone');

  if (!user) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  successResponse(res, 200, 'Patient profile fetched', user);
});

// ─── Update Patient Profile ───────────────────────────────────────────────────
// PUT /api/patients/profile
const updatePatientProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  const updatableFields = ['name', 'dateOfBirth', 'gender', 'bloodGroup', 'insuranceProvider', 'insurancePolicyNumber'];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  if (req.body.allergies) user.allergies = JSON.parse(req.body.allergies);
  if (req.body.chronicConditions) user.chronicConditions = JSON.parse(req.body.chronicConditions);
  if (req.body.emergencyContact) user.emergencyContact = JSON.parse(req.body.emergencyContact);
  if (req.body.address) user.address = JSON.parse(req.body.address);

  if (req.file) {
    if (user.profileImage?.publicId) {
      await deleteFromCloudinary(user.profileImage.publicId);
    }
    const { url, publicId } = await uploadAvatar(req.file.buffer);
    user.profileImage = { url, publicId };
  }

  const updatedUser = await user.save();
  successResponse(res, 200, 'Patient profile updated', updatedUser);
});

// ─── Get All Patients (Admin/Hospital/Doctor) ─────────────────────────────────
// GET /api/patients
const getAllPatients = asyncHandler(async (req, res) => {
  const filter = { role: 'user' };

  if (req.user.role === 'hospital') {
    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (hospital) filter.assignedHospital = hospital._id;
  } else if (req.user.role === 'doctor') {
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (doctor) filter.assignedDoctor = doctor._id;
  }

  if (req.query.search) {
    filter.$or = [
      { name: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
    ];
  }

  const { docs, pagination } = await paginate(User, filter, {
    page: req.query.page,
    limit: req.query.limit,
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'Patients fetched', docs, pagination);
});

// ─── Get Patient By ID ────────────────────────────────────────────────────────
// GET /api/patients/:id
const getPatientById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('assignedCaregiver', 'name profileImage')
    .populate('assignedHospital', 'name')
    .populate('assignedDoctor', 'name')
    .populate('familyMembers', 'name relationship phone');

  if (!user) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Access control
  const isAdmin = req.user.role === 'admin';
  const isDoctor = req.user.role === 'doctor';
  const isHospital = req.user.role === 'hospital';
  const isOwner = String(user._id) === String(req.user._id);

  let isCaregiver = false;
  if (req.user.role === 'caregiver') {
    const Caregiver = require('../models/Caregiver');
    const cg = await Caregiver.findOne({ user: req.user._id });
    if (cg && String(user.assignedCaregiver) === String(cg._id)) isCaregiver = true;
  }

  let isFamily = false;
  if (req.user.role === 'family') {
    const FamilyMember = require('../models/FamilyMember');
    const fm = await FamilyMember.findOne({ user: req.user._id, patient: user._id });
    if (fm) isFamily = true;
  }

  if (!isAdmin && !isDoctor && !isHospital && !isOwner && !isCaregiver && !isFamily) {
    res.status(403);
    throw new Error('Access denied to patient details');
  }

  successResponse(res, 200, 'Patient details fetched', user);
});

// ─── Search Patients (Hospital — for Admission) ───────────────────────────────
// GET /api/patients/search?q=...
const searchPatients = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    res.status(400);
    throw new Error('Search query must be at least 2 characters');
  }

  const regex = new RegExp(q.trim(), 'i');

  const patients = await User.find({
    role: 'user',
    $or: [
      { name: regex },
      { email: regex },
      { phone: regex },
    ],
  })
    .select('_id name gender dateOfBirth bloodGroup chronicConditions assignedHospital profileImage email phone avatar')
    .limit(20);

  successResponse(res, 200, 'Patient search results', patients);
});

module.exports = {
  createPatientProfile,
  getMyPatientProfile,
  updatePatientProfile,
  getAllPatients,
  getPatientById,
  searchPatients,
};
