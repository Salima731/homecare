const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');

// ─── Get My Notifications ─────────────────────────────────────────────────────
const getMyNotifications = asyncHandler(async (req, res) => {
  const { docs, pagination } = await paginate(
    Notification,
    { recipient: req.user._id },
    { page: req.query.page, limit: req.query.limit, sort: { createdAt: -1 } }
  );
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });
  paginatedResponse(res, 200, 'Notifications fetched', { notifications: docs, unreadCount }, pagination);
});

// ─── Mark Notification as Read ────────────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) { res.status(404); throw new Error('Notification not found'); }
  successResponse(res, 200, 'Marked as read', notification);
});

// ─── Mark All as Read ─────────────────────────────────────────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  successResponse(res, 200, 'All notifications marked as read');
});

// ─── Delete Notification ──────────────────────────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  successResponse(res, 200, 'Notification deleted');
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
