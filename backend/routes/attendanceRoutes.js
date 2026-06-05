const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getBookingAttendance,
  getAllAttendance,
  approveAttendance,
  getPatientAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/checkin', authorize('caregiver'), checkIn);
router.post('/checkout', authorize('caregiver'), checkOut);

router.get('/my', authorize('caregiver'), getMyAttendance);
router.get('/booking/:bookingId', getBookingAttendance);
router.get('/patient/:patientId', getPatientAttendance);

router.get('/', authorize('admin', 'agency'), getAllAttendance);
router.put('/:id/approve', authorize('admin'), approveAttendance);

module.exports = router;
