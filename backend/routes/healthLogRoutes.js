const express = require('express');
const router = express.Router();
const {
  logVitals,
  getPatientLogs,
  getVitalTrends,
  getLogById,
  createOrUpdateHealthProfile,
  getHealthProfile,
} = require('../controllers/healthLogController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', logVitals);

// Named/specific routes BEFORE dynamic /:id
router.get('/patient/:patientId', getPatientLogs);
router.get('/trends/:patientId', getVitalTrends);
router.post('/profile', createOrUpdateHealthProfile);
router.get('/profile/:patientId', getHealthProfile);

// Dynamic /:id goes LAST
router.get('/:id', getLogById);

module.exports = router;
