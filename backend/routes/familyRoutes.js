const express = require('express');
const router = express.Router();
const {
  createFamilyProfile,
  getMyFamilyProfile,
  updateFamilyProfile,
  getAllFamilyMembers,
  linkPatient,
  getDashboardStats,
  generateCode,
  getMyPatient,
} = require('../controllers/familyMemberController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Family self routes
router.post('/profile', protect, createFamilyProfile);
router.get('/profile', protect, getMyFamilyProfile);
router.put('/profile', protect, updateFamilyProfile);
router.get('/dashboard-stats', protect, authorize('family'), getDashboardStats);
router.post('/link-patient', protect, authorize('family'), linkPatient);
router.post('/generate-code', protect, authorize('user'), generateCode);
router.get('/my-patient', protect, authorize('family'), getMyPatient);

// Admin routes
router.get('/', protect, authorize('admin'), getAllFamilyMembers);

module.exports = router;
