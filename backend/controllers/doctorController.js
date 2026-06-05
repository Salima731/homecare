const asyncHandler = require('../utils/asyncHandler');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const crypto = require('crypto');

// @desc    Add doctor to hospital
// @route   POST /api/doctors
// @access  Private (hospital)
const addDoctor = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }

  const { name, specialization, departmentId, licenseNumber, qualification, experience, phone } = req.body;

  // Validate department belongs to this hospital
  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept || dept.hospital.toString() !== hospital._id.toString()) {
      res.status(400);
      throw new Error('Invalid department — must belong to your hospital');
    }
  }

  const doctorData = {
    hospital: hospital._id,
    department: departmentId,
    name,
    specialization,
    licenseNumber,
    qualification: qualification || [],
    experience: experience || 0,
    phone,
  };

  // Only set user if a userId is explicitly provided — passing undefined/null
  // on a sparse unique field causes a duplicate key error on subsequent inserts
  if (req.body.userId) {
    doctorData.user = req.body.userId;
  }

  const doctor = await Doctor.create(doctorData);

  successResponse(res, 201, 'Doctor added successfully', doctor);
});

// @desc    Get all doctors for a hospital (public)
// @route   GET /api/doctors/hospital/:hospitalId
// @access  Public
const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ hospital: req.params.hospitalId, isActive: true })
    .populate('user', 'name email avatar')
    .populate('department', 'name code');
  successResponse(res, 200, 'Doctors fetched', doctors);
});

// @desc    Get all doctors globally (public search)
// @route   GET /api/doctors
// @access  Public
const getPublicDoctors = asyncHandler(async (req, res) => {
  const { search, hospital } = req.query;
  const filter = { isActive: true, isSuspended: false };
  
  if (hospital) filter.hospital = hospital;
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const { docs, pagination } = await paginate(Doctor, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: 'department', select: 'name code' },
      { path: 'hospital', select: 'hospitalName address' },
    ],
  });

  paginatedResponse(res, 200, 'Doctors fetched', docs, pagination);
});

// @desc    Get MY hospital's doctors
// @route   GET /api/doctors/my
// @access  Private (hospital)
const getMyDoctors = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }

  const { docs, pagination } = await paginate(Doctor, { hospital: hospital._id }, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: 'department', select: 'name code' },
      { path: 'user', select: 'name email' },
    ],
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'Your doctors fetched', docs, pagination);
});

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('department', 'name code floor')
    .populate('hospital', 'hospitalName')
    .populate('user', 'name email avatar');

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  successResponse(res, 200, 'Doctor fetched', doctor);
});

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private (hospital, admin)
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (doctor.hospital.toString() !== hospital._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this doctor');
    }
  }

  const updatedDoc = await Doctor.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('department', 'name');

  successResponse(res, 200, 'Doctor updated', updatedDoc);
});

// @desc    Deactivate (soft-delete) doctor
// @route   DELETE /api/doctors/:id
// @access  Private (hospital, admin)
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (doctor.hospital.toString() !== hospital._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to remove this doctor');
    }
  }

  doctor.isActive = false;
  await doctor.save();

  successResponse(res, 200, 'Doctor removed from hospital', doctor);
});

// @desc    Invite doctor (create login)
// @route   POST /api/doctors/:id/invite
// @access  Private (hospital)
const inviteDoctor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const hospital = await Hospital.findOne({ user: req.user._id });
  if (String(doctor.hospital) !== String(hospital._id)) {
    res.status(403);
    throw new Error('Not authorized to invite this doctor');
  }

  if (doctor.user) {
    res.status(400);
    throw new Error('Doctor already has a login account');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('Email is already registered in the system');
  }

  const user = await User.create({
    name: doctor.name,
    email,
    password,
    role: 'doctor',
    isEmailVerified: true
  });

  doctor.user = user._id;
  await doctor.save();

  successResponse(res, 200, 'Doctor login created successfully', { user, doctor });
});

// @desc    Get logged in doctor profile
// @route   GET /api/doctors/me
// @access  Private (doctor)
const getMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id })
    .populate('department', 'name code')
    .populate('hospital', 'hospitalName address contact');
    
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }
  
  successResponse(res, 200, 'Doctor profile fetched', doctor);
});

// @desc    Get my patients (patients with appointments)
// @route   GET /api/doctors/me/patients
// @access  Private (doctor)
const getMyPatients = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor profile not found');
  }

  // Get distinct patients from appointments
  const appointments = await Appointment.find({ doctor: doctor._id })
    .populate('patient', 'name email phone profileImage dateOfBirth gender bloodGroup address');

  // Dedup patients
  const patientsMap = new Map();
  appointments.forEach(app => {
    if (app.patient && !patientsMap.has(String(app.patient._id))) {
      patientsMap.set(String(app.patient._id), app.patient);
    }
  });

  const patients = Array.from(patientsMap.values());
  successResponse(res, 200, 'Patients fetched', patients);
});

// @desc    Suspend or unsuspend a doctor
// @route   PUT /api/doctors/:id/suspend
// @access  Private (hospital, admin)
const suspendDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (String(doctor.hospital) !== String(hospital._id)) {
      res.status(403);
      throw new Error('Not authorized to suspend this doctor');
    }
  }

  doctor.isSuspended = !doctor.isSuspended;
  await doctor.save();

  successResponse(res, 200, `Doctor ${doctor.isSuspended ? 'suspended' : 'unsuspended'} successfully`, doctor);
});

module.exports = {
  addDoctor,
  getDoctors,
  getPublicDoctors,
  getMyDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  inviteDoctor,
  getMyProfile,
  getMyPatients,
  suspendDoctor,
};
