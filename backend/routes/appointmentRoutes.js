const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getHospitalAppointments,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('user'), createAppointment);
router.get('/', authorize('user', 'doctor', 'hospital', 'family', 'admin'), getMyAppointments);
router.get('/hospital', authorize('hospital'), getHospitalAppointments);
router.get('/:id', authorize('user', 'doctor', 'hospital', 'family', 'admin'), getAppointmentById);
router.put('/:id/status', authorize('doctor'), updateAppointmentStatus);
router.delete('/:id', authorize('user', 'admin'), cancelAppointment);

module.exports = router;
