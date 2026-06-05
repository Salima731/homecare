const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const Agency = require('../models/Agency');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { uploadAvatar, deleteFromCloudinary } = require('../services/cloudinaryService');

// ─── Get My Profile ───────────────────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  successResponse(res, 200, 'Profile fetched', user);
});

// ─── Update My Profile ────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;

  // Handle avatar upload
  if (req.file) {
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }
    const { url, publicId } = await uploadAvatar(req.file.buffer);
    user.avatar = { url, publicId };
  }

  const updated = await user.save();

  // Sync with role-specific models if needed
  if (req.file) {
    if (user.role === 'caregiver') {
      await Caregiver.findOneAndUpdate(
        { user: user._id },
        { profileImage: user.avatar }
      );
    } else if (user.role === 'agency') {
      await Agency.findOneAndUpdate(
        { user: user._id },
        { logo: user.avatar }
      );
    }
  }

  successResponse(res, 200, 'Profile updated', updated);
});

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  
  // For Google users, we allow setting a password without knowing the "current" one
  // because the current one is just a random string generated during registration.
  if (!user.googleId) {
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }
  }

  user.password = newPassword;
  await user.save();

  successResponse(res, 200, 'Password changed successfully');
});

// ─── Admin: Get All Users ─────────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, isBanned } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isBanned !== undefined) filter.isBanned = isBanned === 'true';
  if (search) filter.$or = [
    { name: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
  ];

  const { docs, pagination } = await paginate(User, filter, {
    page: req.query.page,
    limit: req.query.limit,
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'Users fetched', docs, pagination);
});

// ─── Admin: Ban / Unban User ──────────────────────────────────────────────────
const banUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ban, reason } = req.body; // ban: true/false

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot ban an admin account');
  }

  user.isBanned = ban !== false;
  user.banReason = ban !== false ? reason || 'Policy violation' : '';
  await user.save({ validateBeforeSave: false });

  successResponse(res, 200, `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`, {
    _id: user._id,
    isBanned: user.isBanned,
    banReason: user.banReason,
  });
});

// ─── Admin: Delete User ───────────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  successResponse(res, 200, 'User deleted successfully');
});

// ─── Get Dashboard Stats ──────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const Booking = require('../models/Booking');
  const Review = require('../models/Review');

  const mongoose = require('mongoose');
  const [activeBookings, totalSpentData, completedJobs, avgRatingData, upcomingBookings] = await Promise.all([
    Booking.countDocuments({ user: req.user._id, status: { $in: ['pending', 'accepted', 'assigned', 'ongoing'] } }),
    Booking.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id), isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Booking.countDocuments({ user: req.user._id, status: 'completed' }),
    Review.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: null, avg: { $avg: '$ratings.overall' } } }
    ]),
    Booking.find({ 
      user: req.user._id, 
      status: { $in: ['pending', 'accepted', 'assigned', 'ongoing'] },
      endDate: { $gte: new Date() } 
    })
      .populate('caregiver', 'name profileImage')
      .populate('agency', 'agencyName logo')
      .sort({ startDate: 1 })
      .limit(5)
  ]);

  successResponse(res, 200, 'User dashboard stats fetched', {
    activeBookings,
    totalSpent: totalSpentData[0]?.total || 0,
    completedJobs,
    avgRating: avgRatingData[0]?.avg?.toFixed(1) || 'N/A',
    upcomingBookings
  });
});

// ─── Update Notification Settings ─────────────────────────────────────────────
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;
  
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.notificationSettings = {
    ...user.notificationSettings,
    ...settings
  };

  await user.save({ validateBeforeSave: false });
  successResponse(res, 200, 'Notification settings updated', user.notificationSettings);
});

// ─── Toggle Favorite Caregiver ────────────────────────────────────────────────
const toggleFavorite = asyncHandler(async (req, res) => {
  const { caregiverId } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isFavorited = user.favorites.some((id) => id.toString() === caregiverId.toString());

  if (isFavorited) {
    user.favorites = user.favorites.filter((id) => id.toString() !== caregiverId.toString());
  } else {
    user.favorites.push(caregiverId);
  }

  await user.save({ validateBeforeSave: false });

  successResponse(res, 200, isFavorited ? 'Removed from favorites' : 'Added to favorites', user.favorites);
});

// ─── Get Favorite Caregivers ──────────────────────────────────────────────────
const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favorites',
    select: 'name serviceType bio experience rates profileImage avgRating reviewCount isVerified location',
    populate: { path: 'agency', select: 'agencyName' }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  successResponse(res, 200, 'Favorites fetched', user.favorites);
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateNotificationSettings,
  getDashboardStats,
  getAllUsers,
  banUser,
  deleteUser,
  toggleFavorite,
  getFavorites,
};
