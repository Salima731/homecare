const asyncHandler = require("../utils/asyncHandler");
const HealthLog = require("../models/HealthLog");
const HealthProfile = require("../models/HealthProfile");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Caregiver = require("../models/Caregiver");
const Booking = require("../models/Booking");
const FamilyMember = require("../models/FamilyMember");
const {
  successResponse,
  paginatedResponse,
} = require("../utils/responseHandler");
const { paginate } = require("../utils/paginate");
const { createNotification } = require("../services/notificationService");

// ─── Helper: Detect if any vital is abnormal ─────────────────────────────────
const detectAbnormal = (vitals) => {
  if (!vitals) return false;
  return (
    vitals.bloodPressure?.status === "critical" ||
    vitals.bloodSugar?.status === "critical" ||
    vitals.oxygenSaturation?.status === "critical" ||
    vitals.heartRate?.status === "critical" ||
    vitals.temperature?.status === "high_fever" ||
    vitals.heartRate?.status === "high" ||
    vitals.oxygenSaturation?.status === "low"
  );
};

// ─── Helper: Derive vital status from numeric value ──────────────────────────
const deriveVitalStatus = (vitals) => {
  const v = { ...vitals };

  // Blood Pressure (mmHg)
  if (v.bloodPressure?.systolic !== undefined) {
    const s = v.bloodPressure.systolic;
    if (s >= 180) v.bloodPressure.status = "critical";
    else if (s >= 140) v.bloodPressure.status = "high";
    else if (s >= 120) v.bloodPressure.status = "elevated";
    else if (s < 90) v.bloodPressure.status = "low";
    else v.bloodPressure.status = "normal";
  }

  // Blood Sugar (mg/dL)
  if (v.bloodSugar?.value !== undefined) {
    const bs = v.bloodSugar.value;
    if (bs >= 400) v.bloodSugar.status = "critical";
    else if (bs >= 200) v.bloodSugar.status = "high";
    else if (bs < 70) v.bloodSugar.status = "low";
    else v.bloodSugar.status = "normal";
  }

  // Oxygen Saturation (%)
  if (v.oxygenSaturation?.value !== undefined) {
    const o = v.oxygenSaturation.value;
    if (o < 90) v.oxygenSaturation.status = "critical";
    else if (o < 95) v.oxygenSaturation.status = "low";
    else v.oxygenSaturation.status = "normal";
  }

  // Heart Rate (BPM)
  if (v.heartRate?.value !== undefined) {
    const hr = v.heartRate.value;
    if (hr >= 150 || hr < 40) v.heartRate.status = "critical";
    else if (hr >= 100) v.heartRate.status = "high";
    else if (hr < 60) v.heartRate.status = "low";
    else v.heartRate.status = "normal";
  }

  // Temperature (Celsius)
  if (v.temperature?.value !== undefined) {
    const t = v.temperature.value;
    if (t >= 40) v.temperature.status = "high_fever";
    else if (t >= 38) v.temperature.status = "fever";
    else if (t < 35) v.temperature.status = "low";
    else v.temperature.status = "normal";
  }

  return v;
};

// ─── Helper: Send health alerts to stakeholders ───────────────────────────────
const sendHealthAlerts = asyncHandler(async (log, patient, req) => {
  if (!log.isAbnormal || !req.io) return;

  // Notify family members
  const familyMembers = await FamilyMember.find({
    patient: patient._id,
    canReceiveEmergencyAlerts: true,
  });

  const alertPayload = {
    patientId: patient._id,
    patientName: patient.name,
    logId: log._id,
    vitals: log.vitals,
    message: `⚠️ Abnormal vital signs recorded for ${patient.name}. Please check immediately.`,
    timestamp: new Date(),
  };

  for (const fm of familyMembers) {
    req.io.to(`user_${fm.user}`).emit("health_alert_critical", alertPayload);
    await createNotification(req.io, {
      recipient: fm.user,
      type: "health_alert",
      title: "⚠️ Critical Health Alert",
      message: `Abnormal vitals detected for ${patient.name}`,
      data: { logId: log._id, patientId: patient._id },
    });
  }

  // Notify assigned doctor
  if (patient.assignedDoctor) {
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findById(patient.assignedDoctor).select("user");
    if (doctor?.user) {
      req.io
        .to(`user_${doctor.user}`)
        .emit("health_alert_critical", alertPayload);
      await createNotification(req.io, {
        recipient: doctor.user,
        type: "health_alert",
        title: "⚠️ Patient Health Alert",
        message: `Abnormal vitals for patient ${patient.name}`,
        data: { logId: log._id, patientId: patient._id },
      });
    }
  }

  // Mark alertSent
  await HealthLog.findByIdAndUpdate(log._id, { alertSent: true });
});

const getActorRole = (role) => (role === "user" ? "patient" : role);

const findActiveCaregiverBooking = async (userId, patient, bookingId) => {
  const caregiver = await Caregiver.findOne({ user: userId });
  if (!caregiver) return { caregiver: null, booking: null };

  const now = new Date();
  const filter = {
    caregiver: caregiver._id,
    user: patient.user,
    status: { $in: ["assigned", "ongoing"] },
    startDate: { $lte: now },
    endDate: { $gte: now },
  };

  if (bookingId) filter._id = bookingId;

  const booking = await Booking.findOne(filter);
  return { caregiver, booking };
};

const getHealthAccess = async (req, patient) => {
  const isAdmin = req.user.role === "admin";
  const isOwner = String(patient.user) === String(req.user._id);
  const isDoctor = req.user.role === "doctor";

  let isFamily = false;
  if (req.user.role === "family") {
    const orQuery = [{ patient: patient._id }];
    if (patient.user) orQuery.push({ patient: patient.user });
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      $or: orQuery,
      canReceiveHealthReports: true,
    });
    isFamily = !!fm;
  }

  let caregiver;
  let booking;
  if (req.user.role === "caregiver") {
    const result = await findActiveCaregiverBooking(req.user._id, patient);
    caregiver = result.caregiver;
    booking = result.booking;
  }

  return {
    isAdmin,
    isOwner,
    isDoctor,
    isFamily,
    isCaregiver: !!booking,
    caregiver,
    booking,
    canView: isAdmin || isOwner || isDoctor || isFamily || !!booking,
    canUpdate: isAdmin || isOwner || isDoctor || !!booking,
  };
};

// ─── Create Health Log (Caregiver, Patient, or Admin) ────────────────────────
// POST /api/health-logs
const createHealthLog = asyncHandler(async (req, res) => {
  const {
    patientId,
    bookingId,
    vitals,
    symptoms,
    notes,
    mood,
    medicationAdherence,
    logDate,
  } = req.body;

  if (!patientId) {
    res.status(400);
    throw new Error("patientId is required");
  }

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

  if (!patient) {
    const userExists = await User.findById(patientId);
    if (!userExists) {
      res.status(404);
      throw new Error("Patient not found");
    }
    patient = {
      _id: null,
      user: userExists._id,
      name: userExists.name,
    };
  }

  const patientUserId = patient.user?._id || patient.user;

  // Authorization
  const isAdmin = req.user.role === "admin";
  const isPatientOwner = String(patientUserId) === String(req.user._id);

  let caregiverId = req.health?.caregiverId;
  let actualBookingId = req.health?.bookingId || bookingId;

  if (req.user.role === "caregiver") {
    if (!caregiverId || !actualBookingId) {
      const { caregiver, booking } = await findActiveCaregiverBooking(
        req.user._id,
        patient,
        bookingId,
      );
      caregiverId = caregiver?._id;
      actualBookingId = booking?._id;
    }

    if (!caregiverId) {
      res.status(404);
      throw new Error("Caregiver profile not found");
    }

    if (!actualBookingId) {
      res.status(403);
      throw new Error("You do not have an active booking with this patient");
    }
  }

  if (!isAdmin && !isPatientOwner && !caregiverId) {
    res.status(403);
    throw new Error("Not authorized to create health log for this patient");
  }

  // Process vitals and derive statuses
  const processedVitals = deriveVitalStatus(vitals || {});
  const isAbnormal = detectAbnormal(processedVitals);

  const log = await HealthLog.create({
    patient: patientUserId,
    caregiver: caregiverId || undefined,
    booking: actualBookingId || undefined,
    logDate: logDate ? new Date(logDate) : new Date(),
    vitals: processedVitals,
    symptoms: symptoms || [],
    notes: notes || "",
    mood: mood || "good",
    medicationAdherence: medicationAdherence || "not_tracked",
    isAbnormal,
    alertSent: false,
    recordedBy: req.user._id,
    recordedByRole: getActorRole(req.user.role),
    lastUpdatedBy: req.user._id,
    lastUpdatedByRole: getActorRole(req.user.role),
  });

  // Populate for response
  await log.populate([
    { path: "caregiver", select: "name profileImage" },
    { path: "recordedBy", select: "name email" },
  ]);

  // Send alerts if abnormal
  await sendHealthAlerts(log, patient, req);

  successResponse(
    res,
    201,
    isAbnormal
      ? "⚠️ Vitals logged — abnormal values detected"
      : "Vitals logged successfully",
    log,
  );
});

// ─── Get Patient Health Logs ──────────────────────────────────────────────────
// GET /api/health-logs/patient/:patientId
const getPatientLogs = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { startDate, endDate, isAbnormal, sortBy } = req.query;

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

  if (!patient) {
    const userExists = await User.findById(patientId);
    if (!userExists) {
      res.status(404);
      throw new Error("Patient not found");
    }
    patient = {
      _id: null,
      user: userExists._id,
      name: userExists.name,
    };
  }

  const patientUserId = patient.user?._id || patient.user;

  // Access control
  const isAdmin = req.user.role === "admin";
  const isOwner = String(patientUserId) === String(req.user._id);
  const isDoctor = req.user.role === "doctor";

  let isFamilyAuthorized = false;
  if (req.user.role === "family") {
    const patientDocId = patient._id;
    const orQuery = [{ patient: patientUserId }];
    if (patientDocId) orQuery.push({ patient: patientDocId });
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      $or: orQuery,
      canReceiveHealthReports: true,
    });
    isFamilyAuthorized = !!fm;
  }

  let isCaregiverAuthorized = false;
  if (req.user.role === "caregiver") {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (caregiver) {
      const now = new Date();
      const activeBooking = await Booking.findOne({
        caregiver: caregiver._id,
        user: patientUserId,
        status: { $in: ["assigned", "ongoing"] },
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
      isCaregiverAuthorized = !!activeBooking;
    }
  }

  let isHospitalAuthorized = false;
  if (req.user.role === "hospital") {
    const Hospital = require("../models/Hospital");
    const hospital = await Hospital.findOne({ user: req.user._id });
    isHospitalAuthorized =
      hospital && patient.assignedHospital && String(patient.assignedHospital) === String(hospital._id);
  }

  if (
    !isAdmin &&
    !isOwner &&
    !isDoctor &&
    !isFamilyAuthorized &&
    !isCaregiverAuthorized &&
    !isHospitalAuthorized
  ) {
    res.status(403);
    throw new Error("Access denied to patient health logs");
  }

  const filter = { patient: patientUserId };
  if (startDate || endDate) {
    filter.logDate = {};
    if (startDate) filter.logDate.$gte = new Date(startDate);
    if (endDate) filter.logDate.$lte = new Date(endDate);
  }
  if (isAbnormal !== undefined) filter.isAbnormal = isAbnormal === "true";

  const sortOption = {};
  if (sortBy === "abnormal") {
    sortOption.isAbnormal = -1;
    sortOption.logDate = -1;
  } else {
    sortOption.logDate = -1;
  }

  const { docs, pagination } = await paginate(HealthLog, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: "caregiver", select: "name profileImage" },
      { path: "recordedBy", select: "name" },
    ],
    sort: sortOption,
  });

  paginatedResponse(res, 200, "Health logs fetched", docs, pagination);
});

// ─── Get Latest Health Summary ───────────────────────────────────────────────
// GET /api/health-logs/latest/:patientId
const getLatestHealthSummary = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

  if (!patient) {
    const userExists = await User.findById(patientId);
    if (!userExists) {
      res.status(404);
      throw new Error("Patient not found");
    }
    patient = {
      _id: null,
      user: userExists._id,
      name: userExists.name,
    };
  }

  const patientUserId = patient.user?._id || patient.user;

  // Access control (reuse from getPatientLogs)
  const isAdmin = req.user.role === "admin";
  const isOwner = String(patientUserId) === String(req.user._id);
  const isDoctor = req.user.role === "doctor";

  let isFamilyAuthorized = false;
  if (req.user.role === "family") {
    const patientDocId = patient._id;
    const orQuery = [{ patient: patientUserId }];
    if (patientDocId) orQuery.push({ patient: patientDocId });
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      $or: orQuery,
      canReceiveHealthReports: true,
    });
    isFamilyAuthorized = !!fm;
  }

  let isCaregiverAuthorized = false;
  if (req.user.role === "caregiver") {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (caregiver) {
      const now = new Date();
      const activeBooking = await Booking.findOne({
        caregiver: caregiver._id,
        user: patientUserId,
        status: { $in: ["assigned", "ongoing"] },
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
      isCaregiverAuthorized = !!activeBooking;
    }
  }

  let isHospitalAuthorized = false;
  if (req.user.role === "hospital") {
    const Hospital = require("../models/Hospital");
    const hospital = await Hospital.findOne({ user: req.user._id });
    isHospitalAuthorized =
      hospital && patient.assignedHospital && String(patient.assignedHospital) === String(hospital._id);
  }

  if (
    !isAdmin &&
    !isOwner &&
    !isDoctor &&
    !isFamilyAuthorized &&
    !isCaregiverAuthorized &&
    !isHospitalAuthorized
  ) {
    res.status(403);
    throw new Error("Access denied to patient health data");
  }

  // Get latest log
  const latestLog = await HealthLog.findOne({ patient: patientUserId })
    .populate("caregiver", "name profileImage")
    .sort({ logDate: -1 });

  // Get health profile
  const profile = await HealthProfile.findOne({ patient: patientUserId });

  // Get today's logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLogs = await HealthLog.find({
    patient: patientUserId,
    logDate: { $gte: today, $lt: tomorrow },
  }).sort({ logDate: 1 });

  // Count abnormal this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const abnormalThisWeek = await HealthLog.countDocuments({
    patient: patientUserId,
    isAbnormal: true,
    logDate: { $gte: weekAgo },
  });

  successResponse(res, 200, "Latest health summary", {
    latestLog,
    profile,
    todayLogs,
    stats: {
      abnormalThisWeek,
      totalLogsToday: todayLogs.length,
    },
  });
});

// ─── Get Vital Trends (Chart Data) ───────────────────────────────────────────
// GET /api/health-logs/trends/:patientId
const getVitalTrends = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const days = Math.min(parseInt(req.query.days, 10) || 30, 365); // Max 1 year

  const since = new Date();
  since.setDate(since.getDate() - days);

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

  if (!patient) {
    const userExists = await User.findById(patientId);
    if (!userExists) {
      res.status(404);
      throw new Error("Patient not found");
    }
    patient = {
      _id: null,
      user: userExists._id,
      name: userExists.name,
    };
  }

  const patientUserId = patient.user?._id || patient.user;

  // Access control
  const isAdmin = req.user.role === "admin";
  const isOwner = String(patientUserId) === String(req.user._id);
  const isDoctor = req.user.role === "doctor";

  let isFamilyAuthorized = false;
  if (req.user.role === "family") {
    const patientDocId = patient._id;
    const orQuery = [{ patient: patientUserId }];
    if (patientDocId) orQuery.push({ patient: patientDocId });
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      $or: orQuery,
      canReceiveHealthReports: true,
    });
    isFamilyAuthorized = !!fm;
  }

  let isCaregiverAuthorized = false;
  if (req.user.role === "caregiver") {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (caregiver) {
      const now = new Date();
      const activeBooking = await Booking.findOne({
        caregiver: caregiver._id,
        user: patientUserId,
        status: { $in: ["assigned", "ongoing"] },
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
      isCaregiverAuthorized = !!activeBooking;
    }
  }

  let isHospitalAuthorized = false;
  if (req.user.role === "hospital") {
    const Hospital = require("../models/Hospital");
    const hospital = await Hospital.findOne({ user: req.user._id });
    isHospitalAuthorized =
      hospital && patient.assignedHospital && String(patient.assignedHospital) === String(hospital._id);
  }

  if (
    !isAdmin &&
    !isOwner &&
    !isDoctor &&
    !isFamilyAuthorized &&
    !isCaregiverAuthorized &&
    !isHospitalAuthorized
  ) {
    res.status(403);
    throw new Error("Access denied to patient health trends");
  }

  const logs = await HealthLog.find({
    patient: patientUserId,
    logDate: { $gte: since },
  })
    .select("logDate vitals mood isAbnormal medicationAdherence")
    .sort({ logDate: 1 });

  // Build trend arrays per vital
  const trends = {
    bloodPressure: [],
    bloodSugar: [],
    oxygenSaturation: [],
    heartRate: [],
    temperature: [],
    weight: [],
    mood: [],
    medicationAdherence: [],
    abnormalDays: 0,
  };

  logs.forEach((log) => {
    const date = log.logDate.toISOString().split("T")[0];

    if (log.vitals?.bloodPressure?.systolic) {
      trends.bloodPressure.push({
        date,
        systolic: log.vitals.bloodPressure.systolic,
        diastolic: log.vitals.bloodPressure.diastolic,
        status: log.vitals.bloodPressure.status,
      });
    }
    if (log.vitals?.bloodSugar?.value) {
      trends.bloodSugar.push({
        date,
        value: log.vitals.bloodSugar.value,
        type: log.vitals.bloodSugar.type,
        status: log.vitals.bloodSugar.status,
      });
    }
    if (log.vitals?.oxygenSaturation?.value) {
      trends.oxygenSaturation.push({
        date,
        value: log.vitals.oxygenSaturation.value,
        status: log.vitals.oxygenSaturation.status,
      });
    }
    if (log.vitals?.heartRate?.value) {
      trends.heartRate.push({
        date,
        value: log.vitals.heartRate.value,
        status: log.vitals.heartRate.status,
      });
    }
    if (log.vitals?.temperature?.value) {
      trends.temperature.push({
        date,
        value: log.vitals.temperature.value,
        status: log.vitals.temperature.status,
      });
    }
    if (log.vitals?.weight) {
      trends.weight.push({ date, value: log.vitals.weight });
    }
    if (log.mood) {
      trends.mood.push({ date, mood: log.mood });
    }
    if (log.medicationAdherence) {
      trends.medicationAdherence.push({
        date,
        adherence: log.medicationAdherence,
      });
    }
    if (log.isAbnormal) trends.abnormalDays++;
  });

  successResponse(res, 200, `Vital trends for last ${days} days`, {
    totalLogs: logs.length,
    abnormalDays: trends.abnormalDays,
    dateRange: { since: since.toISOString(), until: new Date().toISOString() },
    trends,
  });
});

// ─── Get Single Log ───────────────────────────────────────────────────────────
// GET /api/health-logs/:id
const getLogById = asyncHandler(async (req, res) => {
  const log = await HealthLog.findById(req.params.id)
    .populate("patient", "name profileImage user assignedHospital assignedDoctor")
    .populate("caregiver", "name profileImage")
    .populate("recordedBy", "name email")
    .populate("lastUpdatedBy", "name email");

  if (!log) {
    res.status(404);
    throw new Error("Health log not found");
  }

  const access = await getHealthAccess(req, log.patient);

  if (!access.canView) {
    res.status(403);
    throw new Error("Access denied to this health log");
  }

  successResponse(res, 200, "Health log fetched", log);
});

// ─── Update Health Log ────────────────────────────────────────────────────────
// PUT /api/health-logs/:id
const updateHealthLog = asyncHandler(async (req, res) => {
  const { vitals, symptoms, notes, mood, medicationAdherence } = req.body;

  const log = await HealthLog.findById(req.params.id).populate("patient");
  if (!log) {
    res.status(404);
    throw new Error("Health log not found");
  }

  const access = await getHealthAccess(req, log.patient);
  const isRecorder = String(log.recordedBy) === String(req.user._id);

  if (!access.canUpdate && !isRecorder) {
    res.status(403);
    throw new Error("You do not have permission to update this log");
  }

  // Process updated vitals
  if (vitals) {
    log.vitals = deriveVitalStatus(vitals);
    log.isAbnormal = detectAbnormal(log.vitals);
  }

  if (symptoms !== undefined) log.symptoms = symptoms;
  if (notes !== undefined) log.notes = notes;
  if (mood !== undefined) log.mood = mood;
  if (medicationAdherence !== undefined)
    log.medicationAdherence = medicationAdherence;

  log.lastUpdatedBy = req.user._id;
  log.lastUpdatedByRole = getActorRole(req.user.role);
  log.updateHistory.push({
    updatedBy: req.user._id,
    updatedByRole: getActorRole(req.user.role),
    updatedAt: new Date(),
  });

  await log.save();
  await log.populate([
    { path: "caregiver", select: "name profileImage" },
    { path: "recordedBy", select: "name" },
    { path: "lastUpdatedBy", select: "name" },
  ]);

  // Resend alerts if newly abnormal
  if (log.isAbnormal && !log.alertSent) {
    await sendHealthAlerts(log, log.patient, req);
  }

  successResponse(res, 200, "Health log updated", log);
});

// ─── Delete Health Log (Admin Only) ───────────────────────────────────────────
// DELETE /api/health-logs/:id
const deleteHealthLog = asyncHandler(async (req, res) => {
  const log = await HealthLog.findById(req.params.id);
  if (!log) {
    res.status(404);
    throw new Error("Health log not found");
  }

  // Admin only
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Only admins can delete health logs");
  }

  await HealthLog.findByIdAndDelete(req.params.id);
  successResponse(res, 200, "Health log deleted");
});

// ─── Health Profile ───────────────────────────────────────────────────────────
// POST /api/health-logs/profile
const createOrUpdateHealthProfile = asyncHandler(async (req, res) => {
  const {
    patientId,
    currentMedications,
    pastSurgeries,
    familyHistory,
    lifestyle,
    disability,
    primaryPhysician,
  } = req.body;

  if (!patientId) {
    res.status(400);
    throw new Error("patientId is required");
  }

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

  if (!patient) {
    const userExists = await User.findById(patientId);
    if (!userExists) {
      res.status(404);
      throw new Error("Patient not found");
    }
    patient = {
      _id: null,
      user: userExists._id,
      name: userExists.name,
    };
  }

  const patientUserId = patient.user?._id || patient.user;

  // Only patient owner or admin
  const isAdmin = req.user.role === "admin";
  const isOwner = String(patientUserId) === String(req.user._id);

  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error("Not authorized to update this health profile");
  }

  const profile = await HealthProfile.findOneAndUpdate(
    { patient: patientUserId },
    {
      currentMedications,
      pastSurgeries,
      familyHistory,
      lifestyle,
      disability,
      primaryPhysician,
    },
    { upsert: true, new: true, runValidators: true },
  );

  successResponse(res, 200, "Health profile saved", profile);
});

// GET /api/health-logs/profile/:patientId
const getHealthProfile = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

  if (!patient) {
    const userExists = await User.findById(patientId);
    if (!userExists) {
      res.status(404);
      throw new Error("Patient not found");
    }
    patient = {
      _id: null,
      user: userExists._id,
      name: userExists.name,
    };
  }

  const patientUserId = patient.user?._id || patient.user;

  // Access control
  const isAdmin = req.user.role === "admin";
  const isOwner = String(patientUserId) === String(req.user._id);
  const isDoctor = req.user.role === "doctor";

  let isFamilyAuthorized = false;
  if (req.user.role === "family") {
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      patient: patientUserId,
      canReceiveHealthReports: true,
    });
    isFamilyAuthorized = !!fm;
  }

  if (!isAdmin && !isOwner && !isDoctor && !isFamilyAuthorized) {
    res.status(403);
    throw new Error("Access denied to health profile");
  }

  const profile = await HealthProfile.findOne({ patient: patientUserId }).populate(
    "patient",
    "name profileImage",
  );

  if (!profile) {
    return successResponse(res, 200, "Health profile not yet created", null);
  }

  successResponse(res, 200, "Health profile fetched", profile);
});

// ─── Get Caregiver's Assigned Patients ────────────────────────────────────────
// GET /api/health-logs/caregiver/patients
const getCaregiverPatients = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error("Caregiver not found");
  }

  const now = new Date();
  const activeBookings = await Booking.find({
    caregiver: caregiver._id,
    status: { $in: ["assigned", "ongoing"] },
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .populate("user", "name email phone")
    .select("user startDate endDate serviceType");

  // Get patient records for those users
  const patientUsers = activeBookings
    .filter((booking) => booking.user)
    .map((booking) => booking.user._id);
  const patients = await Patient.find({ user: { $in: patientUsers } })
    .populate("user", "name email phone")
    .select("name dateOfBirth bloodGroup allergies chronicConditions");

  const bookingByUser = activeBookings.reduce((map, booking) => {
    if (booking.user?._id) {
      map[String(booking.user._id)] = booking;
    }
    return map;
  }, {});

  const enrichedPatients = patients.map((patient) => ({
    ...patient.toObject(),
    booking: bookingByUser[String(patient.user._id)],
  }));

  successResponse(res, 200, "Caregiver patients fetched", enrichedPatients);
});

module.exports = {
  createHealthLog,
  getPatientLogs,
  getLatestHealthSummary,
  getVitalTrends,
  getLogById,
  updateHealthLog,
  deleteHealthLog,
  createOrUpdateHealthProfile,
  getHealthProfile,
  getCaregiverPatients,
};
