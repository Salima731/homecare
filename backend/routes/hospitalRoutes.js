const express = require('express');
const router = express.Router();
const {
  registerHospital,
  getHospitals,
  getHospitalById,
  getMyHospital,
  updateHospital,
  getHospitalAnalytics,
  admitPatient,
} = require('../controllers/hospitalController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, checkVerifiedHospital } = require('../middleware/roleMiddleware');

// Public named routes BEFORE dynamic /:id
router.get('/', getHospitals);

// Protected routes — named paths must come before /:id wildcard
router.use(protect);

router.post('/register', authorize('hospital'), registerHospital);
router.get('/my/profile', authorize('hospital'), getMyHospital);
router.get('/my/analytics', authorize('hospital'), checkVerifiedHospital, getHospitalAnalytics);
router.put('/admit/:patientId', authorize('hospital'), checkVerifiedHospital, admitPatient);

// Dynamic /:id routes go LAST
router.get('/:id', getHospitalById);
router.put('/:id', authorize('hospital', 'admin'), updateHospital);

module.exports = router;
