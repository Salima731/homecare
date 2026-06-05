const express = require('express');
const router = express.Router();
const { setAvailability, getAvailability, getMySchedule, deleteSchedule } = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public: view caregiver availability
router.get('/caregiver/:caregiverId', getAvailability);

// Caregiver self
router.get('/me', protect, authorize('caregiver'), getMySchedule);
router.post('/', protect, authorize('caregiver'), setAvailability);
router.delete('/:id', protect, authorize('caregiver'), deleteSchedule);

module.exports = router;
