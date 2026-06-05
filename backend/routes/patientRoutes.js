const express = require('express');
const router = express.Router();
const {
  createPatientProfile,
  getMyPatientProfile,
  updatePatientProfile,
  getAllPatients,
  getPatientById,
  searchPatients,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProfileImage } = require('../middleware/uploadMiddleware');

// Patient self routes
router.post('/profile', protect, uploadProfileImage, createPatientProfile);
router.get('/profile', protect, getMyPatientProfile);
router.put('/profile', protect, uploadProfileImage, updatePatientProfile);

// Hospital patient search — BEFORE /:id wildcard
router.get('/search', protect, authorize('admin', 'hospital'), searchPatients);

// Admin, Hospital, Doctor, Family, Caregiver, User routes
router.get('/', protect, authorize('admin', 'hospital', 'doctor'), getAllPatients);
router.get('/:id', protect, authorize('admin', 'hospital', 'doctor', 'family', 'caregiver', 'user'), getPatientById);

module.exports = router;

