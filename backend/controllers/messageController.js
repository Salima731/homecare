const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');
const User = require('../models/User');
const { successResponse } = require('../utils/responseHandler');
const { notifications } = require('../services/notificationService');

/**
 * @desc    Send a message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, content, bookingId } = req.body;

  if (!content || !recipientId) {
    res.status(400);
    throw new Error('Recipient and content are required');
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: recipientId,
    content,
    booking: bookingId || null,
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name avatar')
    .populate('recipient', 'name avatar');

  // Socket notification
  if (req.io) {
    req.io.to(`user_${recipientId.toString()}`).emit('new_message', populatedMessage);
    await notifications.newMessage(req.io, recipientId, req.user.name);
  }

  successResponse(res, 201, 'Message sent successfully', populatedMessage);
});

/**
 * @desc    Get all conversations for current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getConversations = asyncHandler(async (req, res) => {
  // Find all messages where user is either sender or recipient
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { recipient: req.user._id }]
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name avatar role')
    .populate('recipient', 'name avatar role');

  // Group by the other user
  const conversationsMap = new Map();

  messages.forEach(msg => {
    // Safety check: ignore messages with missing users (e.g. deleted accounts)
    if (!msg.sender || !msg.recipient) return;

    const otherUser = msg.sender._id.toString() === req.user._id.toString() 
      ? msg.recipient 
      : msg.sender;
    
    if (!otherUser) return;

    if (!conversationsMap.has(otherUser._id.toString())) {
      conversationsMap.set(otherUser._id.toString(), {
        user: otherUser,
        lastMessage: msg,
        unreadCount: (!msg.isRead && msg.recipient._id.toString() === req.user._id.toString()) ? 1 : 0
      });
    } else if (!msg.isRead && msg.recipient._id.toString() === req.user._id.toString()) {
      conversationsMap.get(otherUser._id.toString()).unreadCount++;
    }
  });

  const conversations = Array.from(conversationsMap.values());
  successResponse(res, 200, 'Conversations fetched', conversations);
});

/**
 * @desc    Get messages for a specific conversation
 * @route   GET /api/messages/:otherUserId
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, recipient: otherUserId },
      { sender: otherUserId, recipient: req.user._id }
    ]
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'name avatar')
    .populate('recipient', 'name avatar');

  // Mark messages as read
  await Message.updateMany(
    { sender: otherUserId, recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  successResponse(res, 200, 'Messages fetched', messages);
});

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
};
