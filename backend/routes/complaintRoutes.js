const express = require('express');
const router = express.Router();
const { raiseComplaint, getMyComplaints, getAllComplaints, resolveComplaint } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadComplaintAttachments } = require('../middleware/uploadMiddleware');

router.post('/', protect, uploadComplaintAttachments, raiseComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/', protect, authorize('admin'), getAllComplaints);
router.put('/:id/resolve', protect, authorize('admin'), resolveComplaint);

module.exports = router;
