const asyncHandler = require('../utils/asyncHandler');
const MedicationLog = require('../models/MedicationLog');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { createNotification } = require('../services/notificationService');

// ─── Log Medication Taken ─────────────────────────────────────────────────────
// POST /api/medications/log
const logMedication = asyncHandler(async (req, res) => {
  const { prescriptionId, patientId, medicationName, scheduledTime, status, notes } = req.body;

  if (!prescriptionId || !patientId || !medicationName || !scheduledTime) {
    res.status(400);
    throw new Error('prescriptionId, patientId, medicationName, and scheduledTime are required');
  }

  // Ensure prescription exists and is active
  const prescription = await Prescription.findOne({ _id: prescriptionId, patient: patientId, status: 'active' });
  if (!prescription) {
    res.status(404);
    throw new Error('Active prescription not found for this patient');
  }

  // Identify who is logging
  let caregiverId;
  if (req.user.role === 'caregiver') {
    const cg = await Caregiver.findOne({ user: req.user._id });
    caregiverId = cg?._id;
  }

  // Only allow patient owner, their assigned caregiver, or admin to log
  const patient = await User.findById(patientId);
  const isPatient = String(patient?._id) === String(req.user._id);
  const isAssignedCaregiver = caregiverId && String(patient?.assignedCaregiver) === String(caregiverId);
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isAssignedCaregiver && !isAdmin) {
    res.status(403);
    throw new Error('Only the patient or their assigned caregiver can log medications');
  }

  // Upsert the log for this specific scheduled time (prevent duplicates)
  const query = {
    prescription: prescriptionId,
    patient: patientId,
    medicationName,
    scheduledTime: new Date(scheduledTime)
  };

  const update = {
    caregiver: caregiverId || undefined,
    takenAt: status === 'taken' ? new Date() : undefined,
    status: status || 'taken',
    confirmedBy: req.user._id,
    notes: notes || ''
  };

  const log = await MedicationLog.findOneAndUpdate(query, update, { upsert: true, new: true, runValidators: true });

  // If missed, notify family
  if (status === 'missed' && req.io) {
    const FamilyMember = require('../models/FamilyMember');
    const familyMembers = await FamilyMember.find({ patient: patientId, canReceiveHealthReports: true });
    
    for (const fm of familyMembers) {
      req.io.to(`user_${fm.user}`).emit('medication_missed', {
        patientId,
        medicationName,
        scheduledTime,
      });
      await createNotification(req.io, {
        recipient: fm.user,
        type: 'medication_alert',
        title: '⚠️ Missed Medication',
        message: `${patient.name} missed their scheduled medication: ${medicationName}`,
        data: { logId: log._id, patientId },
      });
    }
  }

  successResponse(res, 200, `Medication logged as ${status}`, log);
});

// ─── Get Patient Medication History ───────────────────────────────────────────
// GET /api/medications/patient/:patientId
const getPatientMedicationHistory = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { startDate, endDate, status } = req.query;

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

  // Access control
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
    const FamilyMember = require('../models/FamilyMember');
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
    throw new Error('Access denied to medication history');
  }

  const filter = { patient: patientUserId };
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.scheduledTime = {};
    if (startDate) filter.scheduledTime.$gte = new Date(startDate);
    if (endDate) filter.scheduledTime.$lte = new Date(endDate);
  }

  const { docs, pagination } = await paginate(MedicationLog, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: 'prescription', select: 'doctor validUntil' },
      { path: 'confirmedBy', select: 'name role' }
    ],
    sort: { scheduledTime: -1 }
  });

  paginatedResponse(res, 200, 'Medication history fetched', docs, pagination);
});

// ─── Get Pending Medications for Today ────────────────────────────────────────
// GET /api/medications/pending
const getPendingMedications = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let patientIds = [];

  if (req.user.role === 'user') {
    patientIds.push(req.user._id);
  } else if (req.user.role === 'caregiver') {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (caregiver) {
      const patients = await User.find({ assignedCaregiver: caregiver._id, role: 'user' }).select('_id');
      patientIds = patients.map(p => p._id);
    }
  } else if (req.user.role === 'family') {
    const FamilyMember = require('../models/FamilyMember');
    const fm = await FamilyMember.findOne({ user: req.user._id });
    if (fm && fm.patient) {
      let patientUserId = fm.patient;
      const patientDoc = await Patient.findById(fm.patient);
      if (patientDoc) {
        patientUserId = patientDoc.user;
      }
      patientIds.push(patientUserId);
    }
  } else {
    res.status(403);
    throw new Error('Access denied to pending medications');
  }

  if (patientIds.length === 0) {
    return successResponse(res, 200, 'No patients found', []);
  }

  // 1. Find all active prescriptions for these patients
  const activePrescriptions = await Prescription.find({
    patient: { $in: patientIds },
    status: 'active'
  }).populate('patient', 'name profileImage');

  // Generate today's schedule from active prescriptions
  const todaysSchedule = [];

  for (const pres of activePrescriptions) {
    for (const med of pres.medications) {
      if (med.isActive && med.timings && med.timings.length > 0) {
        for (const timeStr of med.timings) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const scheduledTime = new Date(today);
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          todaysSchedule.push({
            prescriptionId: pres._id,
            patient: pres.patient,
            medicationName: med.name,
            dosage: med.dosage,
            instructions: med.instructions,
            scheduledTime
          });
        }
      }
    }
  }

  // 2. Find already logged medications for today
  const existingLogs = await MedicationLog.find({
    patient: { $in: patientIds },
    scheduledTime: { $gte: today, $lt: tomorrow }
  });

  // 3. Filter out the ones already logged
  const pending = todaysSchedule.filter(sched => {
    return !existingLogs.some(log => 
      String(log.prescription) === String(sched.prescriptionId) &&
      log.medicationName === sched.medicationName &&
      log.scheduledTime.getTime() === sched.scheduledTime.getTime()
    );
  });

  successResponse(res, 200, 'Pending medications for today fetched', pending);
});

module.exports = {
  logMedication,
  getPatientMedicationHistory,
  getPendingMedications
};
