const asyncHandler = require('../utils/asyncHandler');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Caregiver = require('../models/Caregiver');
const FamilyMember = require('../models/FamilyMember');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { notifications } = require('../services/notificationService');

// ─── Helper: Get Client IP ────────────────────────────────────────────────────
const getIp = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

// ─── Create Medical Record ────────────────────────────────────────────────────
// POST /api/medical-records
const uploadMedicalRecord = asyncHandler(async (req, res) => {
  const {
    patientId, title, category, diagnosis, notes, visibility,
    tags, appointmentId, prescriptionId
  } = req.body;

  if (!title || !category) {
    res.status(400);
    throw new Error('Title and category are required');
  }

  // Determine patient. If user is patient, default to self if patientId not provided.
  let targetPatientId = patientId;
  if (req.user.role === 'user') {
    targetPatientId = req.user._id;
  }
  
  if (!targetPatientId) {
    res.status(400);
    throw new Error('Patient ID is required');
  }

  const patient = await User.findById(targetPatientId);
  if (!patient || patient.role !== 'user') {
    res.status(404);
    throw new Error('Patient not found');
  }

  // File handling
  let reportFile = { url: '', publicId: '', originalName: '' };
  let fileType = '';
  let fileSize = 0;

  if (req.file) {
    const isPdf = req.file.mimetype === 'application/pdf';
    fileType = isPdf ? 'pdf' : req.file.mimetype.split('/')[1];
    fileSize = req.file.size;

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'careconnect/medical-records',
      resource_type: isPdf ? 'raw' : 'image', // raw for PDF
    });

    reportFile = {
      url: result.url,
      publicId: result.publicId,
      originalName: req.file.originalname,
    };
  }

  // Parse tags
  let parsedTags = tags;
  if (typeof tags === 'string') {
    try { parsedTags = JSON.parse(tags); } catch { parsedTags = [tags]; }
  }

  // Setup roles & relationships
  const recordData = {
    patient: targetPatientId,
    uploadedBy: req.user._id,
    uploadedByRole: req.user.role,
    title,
    category,
    diagnosis: diagnosis || '',
    notes: notes || '',
    visibility: visibility || 'private',
    tags: parsedTags || [],
    reportFile,
    fileType,
    fileSize,
  };

  if (appointmentId) recordData.appointment = appointmentId;
  if (prescriptionId) recordData.prescription = prescriptionId;

  // Add context based on uploader role
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (doctor) recordData.doctor = doctor._id;
  } else if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (hospital) recordData.hospital = hospital._id;
  } else if (req.user.role === 'caregiver') {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (caregiver) recordData.caregiver = caregiver._id;
  }

  // Add audit log entry
  recordData.auditLog = [{
    action: 'uploaded',
    performedBy: req.user._id,
    performedByRole: req.user.role,
    ip: getIp(req),
    timestamp: new Date()
  }];

  const record = await MedicalRecord.create(recordData);

  // ── Notify ────────────────────────────────────────────────────────────────
  const io = req.io;

  // Notify patient if uploaded by someone else
  if (String(req.user._id) !== String(targetPatientId)) {
    notifications.medicalRecordUploaded(io, targetPatientId, record._id);
    if (io) {
      io.to(`user_${targetPatientId}`).emit('medical_record_uploaded', { recordId: record._id });
    }
  }

  // Notify family if visibility allows
  if (['family'].includes(record.visibility)) {
    const familyMembers = await FamilyMember.find({
      patient: targetPatientId,
      canReceiveHealthReports: true,
    });
    for (const fm of familyMembers) {
      notifications.medicalRecordUploaded(io, fm.user, record._id);
    }
  }

  successResponse(res, 201, 'Medical record uploaded successfully', record);
});

// ─── Get All Records (Admin) ─────────────────────────────────────────────────
// GET /api/medical-records
const getAllRecords = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const filter = { isDeleted: false };

  const { docs, pagination } = await paginate(MedicalRecord, filter, {
    page,
    limit: limit || 10,
    populate: [
      { path: 'patient', select: 'name email profileImage' },
      { path: 'uploadedBy', select: 'name role' }
    ],
    sort: { uploadedAt: -1 },
  });

  paginatedResponse(res, 200, 'All medical records fetched', docs, pagination);
});

// ─── Get Records By Patient ──────────────────────────────────────────────────
// GET /api/medical-records/patient/:patientId
const getPatientRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { category, uploadedByRole, startDate, endDate, page, limit, search } = req.query;

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
      assignedHospital: userExists.assignedHospital,
    };
  }

  const patientUserId = patient.user?._id || patient.user;
  const patientDocId = patient._id;

  // ── RBAC & Visibility Filter ──
  const isAdmin = req.user.role === 'admin';
  const isOwner = String(patientUserId) === String(req.user._id);
  const isDoctor = req.user.role === 'doctor';
  
  let isHospital = false;
  let myHospitalId = null;
  if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (hospital) {
      isHospital = true;
      myHospitalId = hospital._id;
    }
  }

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

  if (!isAdmin && !isOwner && !isDoctor && !isHospital && !isCaregiver && !isFamily) {
    res.status(403);
    throw new Error('Access denied to patient medical records');
  }

  // Base filter: not deleted, for this patient
  const filter = { patient: patientUserId, isDeleted: false };

  // Visibility logic
  if (!isAdmin && !isOwner && !isDoctor && !isHospital) {
    // Caregiver or Family
    const allowedVisibility = [];
    if (isCaregiver) allowedVisibility.push('caregiver', 'family');
    if (isFamily) allowedVisibility.push('family');
    
    // We can also see records we uploaded ourselves
    filter.$or = [
      { visibility: { $in: allowedVisibility } },
      { uploadedBy: req.user._id }
    ];
  } else if (isHospital && !isAdmin && !isOwner && !isDoctor) {
    // Hospital sees private if they uploaded it (or maybe their doctor uploaded it, but we simplify to: they can see all records because doctors/hospitals have clinical access)
    // Wait, requirement: "doctors assigned to the patient and the patient's hospital should always have access regardless of visibility level."
    // If the user is a hospital, and the patient is assigned to this hospital, they have access.
    // If they just search a random patient, they shouldn't see private records.
    if (String(patient.assignedHospital) !== String(myHospitalId)) {
      filter.$or = [
        { visibility: { $in: ['caregiver', 'family'] } },
        { uploadedBy: req.user._id },
        { hospital: myHospitalId }
      ];
    }
  }

  // ── Query Params ──
  if (category) filter.category = category;
  if (uploadedByRole) filter.uploadedByRole = uploadedByRole;
  if (startDate || endDate) {
    filter.uploadedAt = {};
    if (startDate) filter.uploadedAt.$gte = new Date(startDate);
    if (endDate) filter.uploadedAt.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [
      ...(filter.$or || []),
      { title: new RegExp(search, 'i') },
      { diagnosis: new RegExp(search, 'i') },
      { tags: new RegExp(search, 'i') }
    ];
  }

  const { docs, pagination } = await paginate(MedicalRecord, filter, {
    page,
    limit: limit || 10,
    populate: [
      { path: 'doctor', select: 'name' },
      { path: 'hospital', select: 'name' },
      { path: 'caregiver', select: 'name' },
      { path: 'uploadedBy', select: 'name role' }
    ],
    sort: { uploadedAt: -1 },
  });

  paginatedResponse(res, 200, 'Patient medical records fetched', docs, pagination);
});

// ─── Get Record By ID ────────────────────────────────────────────────────────
// GET /api/medical-records/:id
const getRecordById = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'name email profileImage assignedCaregiver assignedHospital')
    .populate('doctor', 'name specialization')
    .populate('hospital', 'name')
    .populate('uploadedBy', 'name role');

  if (!record || record.isDeleted) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  // ── RBAC Check ──
  const patient = record.patient;
  const isAdmin = req.user.role === 'admin';
  const isOwner = String(patient._id) === String(req.user._id);
  const isUploader = String(record.uploadedBy._id) === String(req.user._id);
  const isDoctor = req.user.role === 'doctor';
  
  let isHospital = false;
  if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (hospital && (String(patient.assignedHospital) === String(hospital._id) || String(record.hospital?._id) === String(hospital._id))) {
      isHospital = true;
    }
  }

  let isCaregiver = false;
  if (req.user.role === 'caregiver') {
    const cg = await Caregiver.findOne({ user: req.user._id });
    if (cg && String(patient.assignedCaregiver) === String(cg._id)) isCaregiver = true;
  }

  let isFamily = false;
  if (req.user.role === 'family') {
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      patient: patient._id,
      canReceiveHealthReports: true,
    });
    if (fm) isFamily = true;
  }

  let hasAccess = false;
  if (isAdmin || isOwner || isUploader || isDoctor || isHospital) {
    hasAccess = true;
  } else if (isCaregiver && ['caregiver', 'family'].includes(record.visibility)) {
    hasAccess = true;
  } else if (isFamily && record.visibility === 'family') {
    hasAccess = true;
  }

  if (!hasAccess) {
    res.status(403);
    throw new Error('Access denied to this medical record');
  }

  // Audit log - viewed
  record.auditLog.push({
    action: 'viewed',
    performedBy: req.user._id,
    performedByRole: req.user.role,
    ip: getIp(req),
    timestamp: new Date()
  });
  
  // Save without triggering validation errors on other fields
  await MedicalRecord.updateOne({ _id: record._id }, { $push: { auditLog: record.auditLog[record.auditLog.length - 1] } });

  successResponse(res, 200, 'Medical record fetched', record);
});

// ─── Update Medical Record ───────────────────────────────────────────────────
// PUT /api/medical-records/:id
const updateMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record || record.isDeleted) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = String(record.uploadedBy) === String(req.user._id);

  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error('Only the uploader or admin can update this record');
  }

  const { title, category, diagnosis, notes, visibility, tags } = req.body;

  if (title !== undefined) record.title = title;
  if (category !== undefined) record.category = category;
  if (diagnosis !== undefined) record.diagnosis = diagnosis;
  if (notes !== undefined) record.notes = notes;
  if (visibility !== undefined) record.visibility = visibility;

  if (tags !== undefined) {
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try { parsedTags = JSON.parse(tags); } catch { parsedTags = [tags]; }
    }
    record.tags = parsedTags;
  }

  if (req.file) {
    const isPdf = req.file.mimetype === 'application/pdf';
    record.fileType = isPdf ? 'pdf' : req.file.mimetype.split('/')[1];
    record.fileSize = req.file.size;

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'careconnect/medical-records',
      resource_type: isPdf ? 'raw' : 'image',
    });

    record.reportFile = {
      url: result.url,
      publicId: result.publicId,
      originalName: req.file.originalname,
    };
  }

  record.auditLog.push({
    action: 'updated',
    performedBy: req.user._id,
    performedByRole: req.user.role,
    ip: getIp(req),
    timestamp: new Date()
  });

  await record.save();

  // Notify patient
  if (String(req.user._id) !== String(record.patient)) {
    notifications.medicalRecordUpdated(req.io, record.patient, record._id);
  }

  successResponse(res, 200, 'Medical record updated', record);
});

// ─── Delete Medical Record (Soft) ────────────────────────────────────────────
// DELETE /api/medical-records/:id
const deleteMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record || record.isDeleted) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = String(record.uploadedBy) === String(req.user._id);

  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error('Only the uploader or admin can delete this record');
  }

  record.isDeleted = true;
  record.deletedAt = new Date();
  record.deletedBy = req.user._id;

  record.auditLog.push({
    action: 'deleted',
    performedBy: req.user._id,
    performedByRole: req.user.role,
    ip: getIp(req),
    timestamp: new Date()
  });

  await record.save();

  successResponse(res, 200, 'Medical record deleted successfully');
});

module.exports = {
  uploadMedicalRecord,
  getAllRecords,
  getPatientRecords,
  getRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
};
