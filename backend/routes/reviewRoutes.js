const express = require('express');
const router = express.Router();
const { createReview, getCaregiverReviews, getAgencyReviews, hideReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('user'), createReview);
router.get('/caregiver/:id', getCaregiverReviews);
router.get('/agency/:id', getAgencyReviews);
router.put('/:id/hide', protect, authorize('admin'), hideReview);

module.exports = router;
