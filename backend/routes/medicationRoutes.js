const express = require('express');
const router = express.Router();
const {
  logMedication,
  getPatientMedicationHistory,
  getPendingMedications,
} = require('../controllers/medicationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/log', logMedication);
router.get('/pending', getPendingMedications);
router.get('/patient/:patientId', getPatientMedicationHistory);

module.exports = router;
