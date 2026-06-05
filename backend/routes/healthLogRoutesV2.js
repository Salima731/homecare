const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/healthLogControllerV2");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  canCreateHealthLog,
  canViewPatientHealth,
} = require("../middleware/healthAuthMiddleware");

router.use(protect);

// ─── Create and List Health Logs ──────────────────────────────────────────────
router.post("/", canCreateHealthLog, createHealthLog);

// ─── Get Caregiver's Patients (Protected Caregiver Route) ─────────────────────
router.get("/caregiver/patients", authorize("caregiver"), getCaregiverPatients);

// ─── Patient-specific routes (BEFORE /:id wildcard) ────────────────────────────
router.get("/patient/:patientId", canViewPatientHealth, getPatientLogs);
router.get("/latest/:patientId", canViewPatientHealth, getLatestHealthSummary);
router.get("/trends/:patientId", canViewPatientHealth, getVitalTrends);

// ─── Health Profile routes ────────────────────────────────────────────────────
router.post("/profile", createOrUpdateHealthProfile);
router.get("/profile/:patientId", getHealthProfile);

// ─── Single Log operations (AFTER specific routes) ────────────────────────────
router.get("/:id", getLogById);
router.put("/:id", updateHealthLog);
router.delete("/:id", authorize("admin"), deleteHealthLog);

module.exports = router;
