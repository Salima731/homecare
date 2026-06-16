const express = require('express');
const router = express.Router();
const {
  uploadMedicalRecord,
  getAllRecords,
  getPatientRecords,
  getRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);

// POST /api/medical-records — Upload new medical record
router.post('/', upload.single('reportFile'), uploadMedicalRecord);

// GET /api/medical-records — Get all records (Admin only)
router.get('/', authorize('admin'), getAllRecords);

// GET /api/medical-records/patient/:patientId — Get records for a specific patient
router.get('/patient/:patientId', getPatientRecords);

// GET /api/medical-records/:id — Get a single record by ID
router.get('/:id', getRecordById);

// PUT /api/medical-records/:id — Update a record
router.put('/:id', upload.single('reportFile'), updateMedicalRecord);

// DELETE /api/medical-records/:id — Soft delete a record
router.delete('/:id', deleteMedicalRecord);

module.exports = router;
