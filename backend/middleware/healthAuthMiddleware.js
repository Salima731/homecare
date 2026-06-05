/**
 * Health monitoring authorization middleware
 * Verifies caregiver access to patient health through active bookings
 */

const asyncHandler = require("../utils/asyncHandler");
const Booking = require("../models/Booking");
const Caregiver = require("../models/Caregiver");
const User = require("../models/User");

const getPatientId = (req) => req.params?.patientId || req.body?.patientId;

/**
 * Verify caregiver has active booking with patient
 * Attaches caregiverId and bookingId to req.health
 */
const verifyCaregiverBooking = asyncHandler(async (req, res, next) => {
  const patientId = getPatientId(req);

  if (!patientId) {
    res.status(400);
    throw new Error("patientId is required");
  }

  const patient = await User.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  if (req.user.role !== "caregiver") {
    return next();
  }

  // Get caregiver profile
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error("Caregiver profile not found");
  }

  // Check for active booking with this patient
  // Must be assigned/ongoing and within date range.
  const now = new Date();
  const activeBooking = await Booking.findOne({
    caregiver: caregiver._id,
    user: patient._id,
    status: { $in: ["assigned", "ongoing"] },
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  if (!activeBooking) {
    res.status(403);
    throw new Error(
      "You do not have an active booking with this patient. Access denied to health records.",
    );
  }

  // Attach to request for later use
  req.health = {
    caregiverId: caregiver._id,
    bookingId: activeBooking._id,
    patientId,
  };

  next();
});

/**
 * Check if user can view patient health
 * Allows: admin, patient owner, doctor, hospital, family with permission, or caregiver with active booking
 */
const canViewPatientHealth = asyncHandler(async (req, res, next) => {
  const patientId = getPatientId(req);

  if (!patientId) {
    res.status(400);
    throw new Error("patientId is required");
  }

  const patient = await User.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const isAdmin = req.user.role === "admin";
  const isPatientOwner = String(patient._id) === String(req.user._id);
  const isDoctor = req.user.role === "doctor";

  // Check family permission
  let isFamilyAuthorized = false;
  if (req.user.role === "family") {
    const FamilyMember = require("../models/FamilyMember");
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      patient: patientId,
      canReceiveHealthReports: true,
    });
    isFamilyAuthorized = !!fm;
  }

  // Check hospital
  let isHospitalAuthorized = false;
  if (req.user.role === "hospital") {
    const Hospital = require("../models/Hospital");
    const hospital = await Hospital.findOne({ user: req.user._id });
    isHospitalAuthorized =
      hospital && String(patient.assignedHospital) === String(hospital._id);
  }

  // Check caregiver with active booking
  let isCaregiverAuthorized = false;
  if (req.user.role === "caregiver") {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (caregiver) {
      const now = new Date();
      const activeBooking = await Booking.findOne({
        caregiver: caregiver._id,
        user: patient._id,
        status: { $in: ["assigned", "ongoing"] },
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
      isCaregiverAuthorized = !!activeBooking;
    }
  }

  if (
    !isAdmin &&
    !isPatientOwner &&
    !isDoctor &&
    !isFamilyAuthorized &&
    !isHospitalAuthorized &&
    !isCaregiverAuthorized
  ) {
    res.status(403);
    throw new Error("Access denied to patient health records");
  }

  req.canViewHealth = {
    isAdmin,
    isOwner: isPatientOwner,
    isDoctor,
    isFamily: isFamilyAuthorized,
    isHospital: isHospitalAuthorized,
    isCaregiver: isCaregiverAuthorized,
  };

  next();
});

/**
 * Only caregiver with active booking or admin can create health log
 */
const canCreateHealthLog = asyncHandler(async (req, res, next) => {
  const patientId = getPatientId(req);

  if (!patientId) {
    res.status(400);
    throw new Error("patientId is required");
  }

  const isAdmin = req.user.role === "admin";
  const isPatientOwner = (async () => {
    const User = require("../models/User");
    const patient = await User.findById(patientId);
    return patient && String(patient._id) === String(req.user._id);
  })();

  // Caregiver must have active booking
  if (req.user.role === "caregiver") {
    await verifyCaregiverBooking(req, res, () => {});
    if (!req.health) {
      res.status(403);
      throw new Error("Caregiver must have active booking to log health data");
    }
    return next();
  }

  // Patient owner can log own data
  if (await isPatientOwner) {
    return next();
  }

  // Admin
  if (isAdmin) {
    return next();
  }

  res.status(403);
  throw new Error(
    "You do not have permission to create health logs for this patient",
  );
});

module.exports = {
  verifyCaregiverBooking,
  canViewPatientHealth,
  canCreateHealthLog,
};
