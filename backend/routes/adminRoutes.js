const express = require('express');
const router = express.Router();
const { 
  getAnalytics, getCommission, updateCommission, 
  getAgencies, updateAgencyStatus, getPendingVerifications, verifyEntity,
  getAllUsers, updateUserStatus,
  getAllComplaints, updateComplaintStatus,
  getPlatformSettings, updatePlatformSettings,
  getAllBookings, getAllPayments, getHospitals, updateHospitalStatus,
  getAllDoctors, getCaregivers, updateCaregiverStatus
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));

router.get('/stats', getAnalytics);
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);
router.get('/commission', getCommission);
router.put('/commission', updateCommission);
router.get('/agencies', getAgencies);
router.put('/agencies/:id/status', updateAgencyStatus);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.get('/pending-verifications', getPendingVerifications);
router.post('/verify/:type/:id', verifyEntity);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);
router.get(
  "/hospitals",
  getHospitals
);
router.get(
  '/caregivers',
  protect,
  authorize('admin'),
  getCaregivers
);

router.patch(
  '/caregivers/:id/status',
  protect,
  authorize('admin'),
  updateCaregiverStatus
);
router.patch(
  "/hospitals/:id/status",
  updateHospitalStatus
);
router.get('/doctors', getAllDoctors);

const { getAdminAllAppointments } = require('../controllers/appointmentController');
router.get('/appointments', getAdminAllAppointments);

module.exports = router;
