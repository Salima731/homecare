const express = require('express');
const router = express.Router();
const {
  addDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  getMyDepartments,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, checkVerifiedHospital } = require('../middleware/roleMiddleware');

// Public route
router.get('/hospital/:hospitalId', getDepartments);

// Hospital's own departments (authenticated)
router.get('/my', protect, authorize('hospital'), getMyDepartments);

router.use(protect);
router.post('/', authorize('hospital'), checkVerifiedHospital, addDepartment);
router.put('/:id', authorize('hospital'), checkVerifiedHospital, updateDepartment);
router.delete('/:id', authorize('hospital'), checkVerifiedHospital, deleteDepartment);

module.exports = router;
