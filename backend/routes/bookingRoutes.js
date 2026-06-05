const express = require('express');
const router = express.Router();
const {
  createBooking, getMyBookings, getAgencyBookings,
  getBookingById, acceptBooking, cancelBooking,
  assignCaregiverToBooking, completeBooking, getAllBookings, clockInBooking,
  clockOutBooking, getCaregiverBookings, getPatientBookings
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// User
router.post('/', protect, authorize('user'), createBooking);
router.get('/my', protect, authorize('user'), getMyBookings);

// Family / Admin / User
router.get('/patient/:patientId', protect, getPatientBookings);

// Agency
router.get('/agency', protect, authorize('agency'), getAgencyBookings);
router.put('/:id/accept', protect, authorize('agency'), acceptBooking);
router.put('/:id/assign', protect, authorize('agency'), assignCaregiverToBooking);
router.put('/:id/complete', protect, authorize('admin'), completeBooking);

// User, agency, or admin can cancel. Caregivers do not reject agency-assigned jobs.
router.put('/:id/cancel', protect, authorize('user', 'agency', 'admin'), cancelBooking);

// Caregiver
router.get('/caregiver', protect, authorize('caregiver'), getCaregiverBookings);
router.put('/:id/clock-in', protect, authorize('caregiver'), clockInBooking);
router.put('/:id/clock-out', protect, authorize('caregiver'), clockOutBooking);

// Admin
router.get('/admin/all', protect, authorize('admin'), getAllBookings);

// Any authenticated user (ownership check in controller) - MUST BE AT THE BOTTOM
router.get('/:id', protect, getBookingById);

module.exports = router;
