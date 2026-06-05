const asyncHandler = require('../utils/asyncHandler');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');

// ─── Create Prescription (Doctor) ─────────────────────────────────────────────
// POST /api/prescriptions
const createPrescription = asyncHandler(async (req, res) => {
  const { patientId, referralId, validUntil, medications, notes, documents } = req.body;

  if (!patientId || !medications || !medications.length) {
    res.status(400);
    throw new Error('Patient ID and at least one medication are required');
  }

  const patient = await User.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    res.status(403);
    throw new Error('Only doctors can create prescriptions');
  }

  const prescription = await Prescription.create({
    patient: patientId,
    doctor: doctor._id,
    hospital: doctor.hospital,
    referral: referralId || undefined,
    validUntil: validUntil || undefined,
    medications,
    notes: notes || '',
    documents: documents || [],
    status: 'active'
  });

  successResponse(res, 201, 'Prescription created successfully', prescription);
});

// ─── Update Prescription ──────────────────────────────────────────────────────
// PUT /api/prescriptions/:id
const updatePrescription = asyncHandler(async (req, res) => {
  const { validUntil, medications, notes, status } = req.body;

  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor || String(prescription.doctor) !== String(doctor._id)) {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only the prescribing doctor or admin can update this prescription');
    }
  }

  if (validUntil !== undefined) prescription.validUntil = validUntil;
  if (notes !== undefined) prescription.notes = notes;
  if (status !== undefined) prescription.status = status;

  if (medications && medications.length) {
    prescription.medications = medications;
  }

  await prescription.save();
  successResponse(res, 200, 'Prescription updated', prescription);
});

// ─── Get Patient Prescriptions ────────────────────────────────────────────────
// GET /api/prescriptions/patient/:patientId
const getPatientPrescriptions = asyncHandler(async (req, res) => {

  let { patientId } = req.params;
console.log(req.params)
  const { status } = req.query;

  // Resolve 'me' alias
  if (patientId === 'me' && req.user.role === 'user') {
    patientId = req.user._id;
  }

  const patient = await User.findById(patientId);

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Access Control
  const isAdmin = req.user.role === 'admin';
  const isOwner = String(patient._id) === String(req.user._id);
  const isDoctor = req.user.role === 'doctor';
  
  let isCaregiver = false;
  if (req.user.role === 'caregiver') {
    const Caregiver = require('../models/Caregiver');
    const cg = await Caregiver.findOne({ user: req.user._id });
    if (cg && String(patient.assignedCaregiver) === String(cg._id)) isCaregiver = true;
  }

  let isFamily = false;
  if (req.user.role === 'family') {
    const FamilyMember = require('../models/FamilyMember');
    const fm = await FamilyMember.findOne({ user: req.user._id, patient: patientId, canReceiveHealthReports: true });
    if (fm) isFamily = true;
  }

  let isHospital = false;
  if (req.user.role === 'hospital') {
    const hosp = await Hospital.findOne({ user: req.user._id });
    if (hosp && String(patient.assignedHospital) === String(hosp._id)) isHospital = true;
  }

  if (!isAdmin && !isOwner && !isDoctor && !isCaregiver && !isFamily && !isHospital) {
    res.status(403);
    throw new Error('Access denied to patient prescriptions');
  }

  const filter = { patient: patientId };
  if (status) filter.status = status;

  const { docs, pagination } = await paginate(Prescription, filter, {
    page: req.query.page,
    limit: req.query.limit || 10,
    populate: [
      { path: 'doctor', select: 'name specialization' },
      { path: 'hospital', select: 'hospitalName' }
    ],
    sort: { prescribedDate: -1 }
  });

  paginatedResponse(res, 200, 'Prescriptions fetched', docs, pagination);
});

// ─── Get Single Prescription ──────────────────────────────────────────────────
// GET /api/prescriptions/:id
const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient', 'name profileImage dateOfBirth')
    .populate('doctor', 'name specialization phone')
    .populate('hospital', 'hospitalName address');

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  successResponse(res, 200, 'Prescription details fetched', prescription);
});

// ─── Get Hospital Prescriptions ───────────────────────────────────────────────
// GET /api/prescriptions/hospital
const getHospitalPrescriptions = asyncHandler(async (req, res) => {
  if (req.user.role !== 'hospital') {
    res.status(403);
    throw new Error('Access denied. Only hospitals can fetch this.');
  }

  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }

  const { status } = req.query;
  const filter = { hospital: hospital._id };
  if (status) filter.status = status;

  const { docs, pagination } = await paginate(Prescription, filter, {
    page: req.query.page,
    limit: req.query.limit || 10,
    populate: [
      { path: 'doctor', select: 'name specialization' },
      { path: 'patient', select: 'name' }
    ],
    sort: { prescribedDate: -1 }
  });

  paginatedResponse(res, 200, 'Hospital prescriptions fetched', docs, pagination);
});

module.exports = {
  createPrescription,
  updatePrescription,
  getPatientPrescriptions,
  getPrescriptionById,
  getHospitalPrescriptions
};
