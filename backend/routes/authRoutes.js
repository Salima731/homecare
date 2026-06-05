const express = require('express');
const router = express.Router();
const {
  sendOTP, register, googleAuth, login, logout, refreshAccessToken,
  verifyEmail, forgotPassword, resetPassword, getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp', sendOTP);
router.post('/register', register);
router.post('/google', googleAuth);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshAccessToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
