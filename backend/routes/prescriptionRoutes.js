const express = require('express');
const router = express.Router();
const {
  createPrescription,
  updatePrescription,
  getPatientPrescriptions,
  getPrescriptionById,
  getHospitalPrescriptions,
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('doctor'), createPrescription);
router.get('/hospital', authorize('hospital'), getHospitalPrescriptions);
router.get('/patient/:patientId', getPatientPrescriptions);
router.get('/:id', getPrescriptionById);
router.put('/:id', authorize('doctor', 'admin'), updatePrescription);

module.exports = router;

