const asyncHandler = require('../utils/asyncHandler');
const HealthLog = require('../models/HealthLog');
const HealthProfile = require('../models/HealthProfile');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { createNotification } = require('../services/notificationService');

// ─── Helper: Detect if any vital is abnormal ─────────────────────────────────
const detectAbnormal = (vitals) => {
  if (!vitals) return false;
  return (
    vitals.bloodPressure?.status === 'critical' ||
    vitals.bloodSugar?.status === 'critical' ||
    vitals.oxygenSaturation?.status === 'critical' ||
    vitals.heartRate?.status === 'critical' ||
    vitals.temperature?.status === 'high_fever' ||
    vitals.heartRate?.status === 'high' ||
    vitals.oxygenSaturation?.status === 'low'
  );
};

// ─── Helper: Derive vital status from numeric value ──────────────────────────
const deriveVitalStatus = (vitals) => {
  const v = { ...vitals };

  if (v.bloodPressure?.systolic !== undefined) {
    const s = v.bloodPressure.systolic;
    if (s >= 180) v.bloodPressure.status = 'critical';
    else if (s >= 140) v.bloodPressure.status = 'high';
    else if (s >= 120) v.bloodPressure.status = 'elevated';
    else if (s < 90) v.bloodPressure.status = 'low';
    else v.bloodPressure.status = 'normal';
  }

  if (v.bloodSugar?.value !== undefined) {
    const bs = v.bloodSugar.value;
    if (bs >= 400) v.bloodSugar.status = 'critical';
    else if (bs >= 200) v.bloodSugar.status = 'high';
    else if (bs < 70) v.bloodSugar.status = 'low';
    else v.bloodSugar.status = 'normal';
  }

  if (v.oxygenSaturation?.value !== undefined) {
    const o = v.oxygenSaturation.value;
    if (o < 90) v.oxygenSaturation.status = 'critical';
    else if (o < 95) v.oxygenSaturation.status = 'low';
    else v.oxygenSaturation.status = 'normal';
  }

  if (v.heartRate?.value !== undefined) {
    const hr = v.heartRate.value;
    if (hr >= 150 || hr < 40) v.heartRate.status = 'critical';
    else if (hr >= 100) v.heartRate.status = 'high';
    else if (hr < 60) v.heartRate.status = 'low';
    else v.heartRate.status = 'normal';
  }

  if (v.temperature?.value !== undefined) {
    const t = v.temperature.value;
    if (t >= 40) v.temperature.status = 'high_fever';
    else if (t >= 38) v.temperature.status = 'fever';
    else if (t < 35) v.temperature.status = 'low';
    else v.temperature.status = 'normal';
  }

  return v;
};

// ─── Log Vitals ──────────────────────────────────────────────────────────────
// POST /api/health-logs
const logVitals = asyncHandler(async (req, res) => {
  const { patientId, bookingId, vitals, symptoms, notes, mood, logDate } = req.body;

  if (!patientId) {
    res.status(400);
    throw new Error('patientId is required');
  }

  // Verify patient exists (patient IS the user)
  const patient = await User.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const isAdmin = req.user.role === 'admin';
  const isPatientOwner = String(patient._id) === String(req.user._id);
  const isDoctor = req.user.role === 'doctor';

  let caregiverId;
  if (req.user.role === 'caregiver') {
    const Caregiver = require('../models/Caregiver');
    const cg = await Caregiver.findOne({ user: req.user._id });
    caregiverId = cg?._id;
  }

  if (!isAdmin && !isPatientOwner && !isDoctor && !caregiverId) {
    res.status(403);
    throw new Error('Access denied — you are not assigned to this patient');
  }

  const processedVitals = deriveVitalStatus(vitals || {});
  const isAbnormal = detectAbnormal(processedVitals);

  const log = await HealthLog.create({
    patient: patientId,
    caregiver: caregiverId || undefined,
    booking: bookingId || undefined,
    logDate: logDate || new Date(),
    vitals: processedVitals,
    symptoms: symptoms || [],
    notes: notes || '',
    mood: mood || 'good',
    isAbnormal,
    alertSent: false,
  });

  // ── Send alert if abnormal vitals detected ──────────────────────────────────
  if (isAbnormal && req.io) {
    const familyMembers = await FamilyMember.find({
      patient: patientId,
      canReceiveEmergencyAlerts: true,
    });

    const alertPayload = {
      patientId,
      patientName: patient.name,
      logId: log._id,
      vitals: processedVitals,
      message: `⚠️ Abnormal vital signs recorded for ${patient.name}. Please check immediately.`,
      timestamp: new Date(),
    };

    for (const fm of familyMembers) {
      req.io.to(`user_${fm.user}`).emit('health_alert_critical', alertPayload);
      await createNotification(req.io, {
        recipient: fm.user,
        type: 'health_alert',
        title: '⚠️ Critical Health Alert',
        message: `Abnormal vitals detected for ${patient.name}`,
        data: { logId: log._id, patientId },
      });
    }

    if (patient.assignedDoctor) {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findById(patient.assignedDoctor).select('user');
      if (doctor?.user) {
        req.io.to(`user_${doctor.user}`).emit('health_alert_critical', alertPayload);
        await createNotification(req.io, {
          recipient: doctor.user,
          type: 'health_alert',
          title: '⚠️ Patient Health Alert',
          message: `Abnormal vitals for patient ${patient.name}`,
          data: { logId: log._id, patientId },
        });
      }
    }

    await HealthLog.findByIdAndUpdate(log._id, { alertSent: true });
  }

  successResponse(res, 201, isAbnormal ? '⚠️ Vitals logged — abnormal values detected' : 'Vitals logged successfully', log);
});

// ─── Get Patient Health Logs ──────────────────────────────────────────────────
// GET /api/health-logs/patient/:patientId
const getPatientLogs = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { startDate, endDate, isAbnormal } = req.query;

  const patient = await User.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = String(patient._id) === String(req.user._id);
  const isDoctor = req.user.role === 'doctor';

  let isFamilyAuthorized = false;
  if (req.user.role === 'family') {
    const fm = await FamilyMember.findOne({ user: req.user._id, patient: patientId, canReceiveHealthReports: true });
    isFamilyAuthorized = !!fm;
  }

  let isCaregiverAssigned = false;
  if (req.user.role === 'caregiver') {
    isCaregiverAssigned = !!patient.assignedCaregiver;
  }

  let isHospitalAuthorized = false;
  if (req.user.role === 'hospital') {
    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findOne({ user: req.user._id });
    isHospitalAuthorized = hospital && String(patient.assignedHospital) === String(hospital._id);
  }

  if (!isAdmin && !isOwner && !isDoctor && !isFamilyAuthorized && !isCaregiverAssigned && !isHospitalAuthorized) {
    res.status(403);
    throw new Error('Access denied to patient health logs');
  }

  const filter = { patient: patientId };
  if (startDate || endDate) {
    filter.logDate = {};
    if (startDate) filter.logDate.$gte = new Date(startDate);
    if (endDate) filter.logDate.$lte = new Date(endDate);
  }
  if (isAbnormal !== undefined) filter.isAbnormal = isAbnormal === 'true';

  const { docs, pagination } = await paginate(HealthLog, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: { path: 'caregiver', select: 'name profileImage' },
    sort: { logDate: -1 },
  });

  paginatedResponse(res, 200, 'Health logs fetched', docs, pagination);
});

// ─── Get Vital Trends (Chart Data) ───────────────────────────────────────────
// GET /api/health-logs/trends/:patientId
const getVitalTrends = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const days = parseInt(req.query.days, 10) || 30;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const patient = await User.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = String(patient._id) === String(req.user._id);
  const isDoctor = req.user.role === 'doctor';

  let isFamilyAuthorized = false;
  if (req.user.role === 'family') {
    const fm = await FamilyMember.findOne({ user: req.user._id, patient: patientId, canReceiveHealthReports: true });
    isFamilyAuthorized = !!fm;
  }

  let isCaregiverAssigned = false;
  if (req.user.role === 'caregiver') {
    isCaregiverAssigned = !!patient.assignedCaregiver;
  }

  let isHospitalAuthorized = false;
  if (req.user.role === 'hospital') {
    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findOne({ user: req.user._id });
    isHospitalAuthorized = hospital && String(patient.assignedHospital) === String(hospital._id);
  }

  if (!isAdmin && !isOwner && !isDoctor && !isFamilyAuthorized && !isCaregiverAssigned && !isHospitalAuthorized) {
    res.status(403);
    throw new Error('Access denied to patient health trends');
  }

  const logs = await HealthLog.find({
    patient: patientId,
    logDate: { $gte: since },
  })
    .select('logDate vitals mood isAbnormal')
    .sort({ logDate: 1 });

  const trends = {
    bloodPressure: [],
    bloodSugar: [],
    oxygenSaturation: [],
    heartRate: [],
    temperature: [],
    weight: [],
    mood: [],
    abnormalDays: 0,
  };

  logs.forEach((log) => {
    const date = log.logDate.toISOString().split('T')[0];
    if (log.vitals?.bloodPressure?.systolic) {
      trends.bloodPressure.push({ date, systolic: log.vitals.bloodPressure.systolic, diastolic: log.vitals.bloodPressure.diastolic, status: log.vitals.bloodPressure.status });
    }
    if (log.vitals?.bloodSugar?.value) {
      trends.bloodSugar.push({ date, value: log.vitals.bloodSugar.value, type: log.vitals.bloodSugar.type, status: log.vitals.bloodSugar.status });
    }
    if (log.vitals?.oxygenSaturation?.value) {
      trends.oxygenSaturation.push({ date, value: log.vitals.oxygenSaturation.value, status: log.vitals.oxygenSaturation.status });
    }
    if (log.vitals?.heartRate?.value) {
      trends.heartRate.push({ date, value: log.vitals.heartRate.value, status: log.vitals.heartRate.status });
    }
    if (log.vitals?.temperature?.value) {
      trends.temperature.push({ date, value: log.vitals.temperature.value, status: log.vitals.temperature.status });
    }
    if (log.vitals?.weight) {
      trends.weight.push({ date, value: log.vitals.weight });
    }
    if (log.mood) {
      trends.mood.push({ date, mood: log.mood });
    }
    if (log.isAbnormal) trends.abnormalDays++;
  });

  successResponse(res, 200, `Vital trends for last ${days} days`, {
    totalLogs: logs.length,
    abnormalDays: trends.abnormalDays,
    trends,
  });
});

// ─── Get Single Log ───────────────────────────────────────────────────────────
const getLogById = asyncHandler(async (req, res) => {
  const log = await HealthLog.findById(req.params.id)
    .populate('patient', 'name profileImage')
    .populate('caregiver', 'name profileImage');

  if (!log) {
    res.status(404);
    throw new Error('Health log not found');
  }

  successResponse(res, 200, 'Health log fetched', log);
});

// ─── Health Profile ───────────────────────────────────────────────────────────
const createOrUpdateHealthProfile = asyncHandler(async (req, res) => {
  const { patientId, currentMedications, pastSurgeries, familyHistory, lifestyle, disability, primaryPhysician } = req.body;

  if (!patientId) {
    res.status(400);
    throw new Error('patientId is required');
  }

  const profile = await HealthProfile.findOneAndUpdate(
    { patient: patientId },
    { currentMedications, pastSurgeries, familyHistory, lifestyle, disability, primaryPhysician },
    { upsert: true, new: true, runValidators: true }
  );

  successResponse(res, 200, 'Health profile saved', profile);
});

const getHealthProfile = asyncHandler(async (req, res) => {
  const profile = await HealthProfile.findOne({ patient: req.params.patientId }).populate('patient', 'name profileImage');

  if (!profile) {
    res.status(404);
    throw new Error('Health profile not found');
  }

  successResponse(res, 200, 'Health profile fetched', profile);
});

module.exports = {
  logVitals,
  getPatientLogs,
  getVitalTrends,
  getLogById,
  createOrUpdateHealthProfile,
  getHealthProfile,
};
