const express = require('express');
const router = express.Router();
const {
  addDoctor,
  getDoctors,
  getPublicDoctors,
  getMyDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  inviteDoctor,
  getMyProfile,
  getMyPatients,
  suspendDoctor,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, checkVerifiedHospital } = require('../middleware/roleMiddleware');

// Specific named routes MUST come before dynamic /:id to avoid conflicts
router.get('/me', protect, authorize('doctor'), getMyProfile);
router.get('/me/patients', protect, authorize('doctor'), getMyPatients);
router.get('/my', protect, authorize('hospital'), getMyDoctors);
router.get('/hospital/:hospitalId', getDoctors);
router.get('/', getPublicDoctors);

// Dynamic id routes (public)
router.get('/:id', getDoctorById);

// Protected mutation routes
router.use(protect);
router.post('/', authorize('hospital'), checkVerifiedHospital, addDoctor);
router.put('/:id', authorize('hospital', 'admin'), updateDoctor);
router.delete('/:id', authorize('hospital', 'admin'), deleteDoctor);
router.post('/:id/invite', authorize('hospital'), inviteDoctor);
router.put('/:id/suspend', authorize('hospital', 'admin'), suspendDoctor);

module.exports = router;
