const express = require('express');
const router = express.Router();
const {
  createProfile, getMyProfile, updateProfile,
  uploadProfileImage, uploadIdProofs, uploadIntroVideo,
  searchCaregivers, getCaregiverById,
  verifyCaregiver, toggleCaregiverStatus, getTrustScore, refreshTrustScore, getMyCaregivers, 
  getCaregiverDashboard, getCaregiverEarnings, getMyReviews,
  addCaregiverByAgency,
} = require('../controllers/caregiverController');
const { getRecommendedCaregivers } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, checkVerifiedAgency } = require('../middleware/roleMiddleware');
const {
  uploadProfileImage: multerAvatar,
  uploadIdProofs: multerIdProofs,
  uploadIntroVideo: multerVideo,
  uploadAgencyCaregiverFiles,
} = require('../middleware/uploadMiddleware');

// Caregiver self
router.get('/dashboard', protect, authorize('caregiver'), getCaregiverDashboard);
router.get('/earnings', protect, authorize('caregiver'), getCaregiverEarnings);
router.get('/reviews/me', protect, authorize('caregiver'), getMyReviews);
router.get('/profile/me', protect, authorize('caregiver'), getMyProfile);
router.post('/profile', protect, authorize('caregiver'), createProfile);
router.put('/profile/me', protect, authorize('caregiver'), updateProfile);
router.post('/profile/avatar', protect, authorize('caregiver'), multerAvatar, uploadProfileImage);
router.post('/profile/id-proofs', protect, authorize('caregiver'), multerIdProofs, uploadIdProofs);
router.post('/profile/video', protect, authorize('caregiver'), multerVideo, uploadIntroVideo);
router.post('/trust-score/refresh', protect, authorize('caregiver'), refreshTrustScore);

// Public
router.get('/recommended', protect, getRecommendedCaregivers);
router.get('/search', searchCaregivers);

// Agency: manage their caregivers — MUST be before /:id wildcard
router.get('/agency/list', protect, authorize('agency'), checkVerifiedAgency, getMyCaregivers);
router.post('/agency/add', protect, authorize('agency'), checkVerifiedAgency, uploadAgencyCaregiverFiles, addCaregiverByAgency);

// Dynamic /:id routes go LAST
router.get('/:id', getCaregiverById);
router.get('/:id/trust-score', getTrustScore);
router.put('/:id/verify', protect, authorize('agency'), checkVerifiedAgency, verifyCaregiver);
router.put('/:id/toggle-status', protect, authorize('agency'), checkVerifiedAgency, toggleCaregiverStatus);

module.exports = router;
