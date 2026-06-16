const express = require('express');
const {
  raiseAlert,
  getAlerts,
  getAlertById,
  updateAlertStatus,
} = require('../controllers/emergencyAlertController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(raiseAlert)
  .get(getAlerts);

router.route('/:id')
  .get(getAlertById);

router.route('/:id/status')
  .put(updateAlertStatus);

module.exports = router;
