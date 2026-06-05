const express = require('express');
const router = express.Router();
const {
  createReferral,
  updateReferralStatus,
  getReferrals,
  getReferralById
} = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('hospital', 'doctor', 'admin'), createReferral);
router.put('/:id/status', protect, authorize('hospital', 'admin', 'agency'), updateReferralStatus);
router.get('/', protect, getReferrals);
router.get('/:id', protect, getReferralById);

module.exports = router;
