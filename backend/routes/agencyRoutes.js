const express = require('express');
const router = express.Router();
console.log('✅ Agency routes loaded');
const {
  registerAgency, getMyAgency, updateAgency, uploadAgencyDocuments,
  getAllAgencies, getAgencyById, approveAgency, rejectAgency, getAgencyEarnings, getAgencyStats,
  assignCaregiver,getAgencyReferrals,assignReferralCaregiver
} = require('../controllers/agencyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadDocuments, uploadProfileImage } = require('../middleware/uploadMiddleware');

// Agency self
router.post('/register', protect, authorize('agency'), registerAgency);
router.get('/profile', protect, authorize('agency'), getMyAgency);
router.put('/profile', protect, authorize('agency'), uploadProfileImage, updateAgency);
router.post('/documents', protect, authorize('agency'), uploadDocuments, uploadAgencyDocuments);
router.get('/earnings', protect, authorize('agency'), getAgencyEarnings);
router.get('/stats', protect, authorize('agency'), getAgencyStats);
router.put('/assign-caregiver', protect, authorize('agency'), assignCaregiver);
router.get('/referrals', protect, authorize('agency'), getAgencyReferrals);

// Public
router.get('/', getAllAgencies);      // status filter is handled inside controller
router.get('/:id', getAgencyById);

// Admin
router.put('/:id/approve', protect, authorize('admin'), approveAgency);
router.put('/:id/reject', protect, authorize('admin'), rejectAgency);
router.put(
  '/:id/assign',
  protect,
  authorize('agency'),
  assignReferralCaregiver
);

module.exports = router;
