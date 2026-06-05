const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification record and emit via socket if available
 * @param {Object} io - Socket.io server instance (optional)
 * @param {Object} payload - { recipient, type, title, message, data }
 * @param {string} preferenceKey - The key in user.notificationSettings to check
 */
const createNotification = async (io, payload, preferenceKey) => {
  // Check user preferences if key provided
  if (preferenceKey) {
    const user = await User.findById(payload.recipient).select('notificationSettings');
    if (user && user.notificationSettings && user.notificationSettings[preferenceKey] === false) {
      return null;
    }
  }

  const notification = await Notification.create({
    recipient: payload.recipient,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data || {},
  });

  // Emit real-time if socket server available
  if (io) {
    io.to(`user_${payload.recipient.toString()}`).emit('new_notification', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: false,
      createdAt: notification.createdAt,
    });
  }

  return notification;
};

/**
 * Bulk notify multiple recipients
 */
const notifyMany = async (io, recipients, type, title, message, data = {}) => {
  return Promise.all(
    recipients.map((recipient) =>
      createNotification(io, { recipient, type, title, message, data })
    )
  );
};

/**
 * Pre-built notification templates
 */
const notifications = {
  bookingCreated: (io, userId, bookingId) =>
    createNotification(io, {
      recipient: userId,
      type: 'booking_created',
      title: 'Booking Submitted',
      message: 'Your booking request has been submitted successfully.',
      data: { bookingId },
    }, 'bookingConfirmations'),

  bookingAccepted: (io, userId, bookingId) =>
    createNotification(io, {
      recipient: userId,
      type: 'booking_accepted',
      title: 'Booking Accepted!',
      message: 'Your booking has been accepted by the agency.',
      data: { bookingId },
    }, 'bookingConfirmations'),

  bookingAssigned: (io, userId, bookingId) =>
    createNotification(io, {
      recipient: userId,
      type: 'booking_assigned',
      title: 'New Job Assigned',
      message: 'You have been assigned to a new care booking.',
      data: { bookingId },
    }, 'bookingConfirmations'),

  bookingCancelled: (io, userId, bookingId, reason) =>
    createNotification(io, {
      recipient: userId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking was cancelled. Reason: ${reason || 'N/A'}`,
      data: { bookingId },
    }, 'bookingConfirmations'),

  bookingCompleted: (io, userId, bookingId) =>
    createNotification(io, {
      recipient: userId,
      type: 'booking_completed',
      title: 'Booking Completed',
      message: 'Your booking has been marked as completed. Please leave a review!',
      data: { bookingId },
    }, 'bookingConfirmations'),

  paymentSuccess: (io, userId, paymentId) =>
    createNotification(io, {
      recipient: userId,
      type: 'payment_success',
      title: 'Payment Successful',
      message: 'Your payment was processed successfully.',
      data: { paymentId },
    }, 'securityAlerts'),

  agencyApproved: (io, userId) =>
    createNotification(io, {
      recipient: userId,
      type: 'agency_approved',
      title: 'Agency Approved!',
      message: 'Congratulations! Your agency has been approved by the admin.',
      data: {},
    }, 'securityAlerts'),

  agencyRejected: (io, userId, reason) =>
    createNotification(io, {
      recipient: userId,
      type: 'agency_rejected',
      title: 'Agency Application Rejected',
      message: `Your agency application was rejected. Reason: ${reason || 'N/A'}`,
      data: {},
    }, 'securityAlerts'),

  complaintResolved: (io, userId, complaintId) =>
    createNotification(io, {
      recipient: userId,
      type: 'complaint_resolved',
      title: 'Complaint Resolved',
      message: 'Your complaint has been reviewed and resolved.',
      data: { complaintId },
    }, 'securityAlerts'),

  newMessage: (io, recipientId, senderName) =>
    createNotification(io, {
      recipient: recipientId,
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message from ${senderName}`,
      data: {},
    }),
};

module.exports = { createNotification, notifyMany, notifications };
