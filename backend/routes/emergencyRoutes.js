const express = require('express');
const router = express.Router();
const {
  triggerSOS,
  updateLocation,
  acknowledgeSOS,
  markResponding,
  resolveSOS,
  getMyIncidents,
  getAllIncidents,
  getIncidentById,
  getPatientIncidents,
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/sos', triggerSOS);
router.get('/my', getMyIncidents);
router.get('/', authorize('admin', 'hospital'), getAllIncidents);
router.get('/patient/:patientId', getPatientIncidents);
router.get('/:id', getIncidentById);

router.post('/:id/location', updateLocation);
router.put('/:id/acknowledge', acknowledgeSOS);
router.put('/:id/respond', markResponding);
router.put('/:id/resolve', resolveSOS);

module.exports = router;
