const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, changePassword, getDashboardStats,
  getAllUsers, banUser, deleteUser, updateNotificationSettings,
  getFavorites, toggleFavorite,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProfileImage } = require('../middleware/uploadMiddleware');

// User self
router.get('/profile', protect, getProfile);
router.get('/dashboard', protect, getDashboardStats);
router.get('/favorites', protect, getFavorites);
router.post('/favorites', protect, toggleFavorite);
router.put('/profile', protect, uploadProfileImage, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/notification-settings', protect, updateNotificationSettings);

// Admin
router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/:id/ban', protect, authorize('admin'), banUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
