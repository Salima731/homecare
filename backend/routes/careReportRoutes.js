const express = require('express');
const router = express.Router();
const {
  createCareReport,
  getReportsByPatient,
  getReportsByBooking,
  updateCareReport,
} = require('../controllers/careReportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);

// POST /api/care-reports — submit a daily report (caregiver only, supports file attachments)
router.post(
  '/',
  authorize('caregiver'),
  upload.array('attachments', 5),
  createCareReport
);

// GET /api/care-reports/patient/:patientId — view all reports for a patient
router.get('/patient/:patientId', getReportsByPatient);

// GET /api/care-reports/booking/:bookingId — view all reports for a booking
router.get('/booking/:bookingId', getReportsByBooking);

// PUT /api/care-reports/:id — edit an existing report (caregiver who submitted + admin)
router.put(
  '/:id',
  authorize('caregiver', 'admin'),
  upload.array('attachments', 5),
  updateCareReport
);

module.exports = router;
