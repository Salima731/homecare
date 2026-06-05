const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { notifications } = require('../services/notificationService');
const { uploadDocument } = require('../services/cloudinaryService');

// ─── Raise Complaint ──────────────────────────────────────────────────────────
const raiseComplaint = asyncHandler(async (req, res) => {
  const { bookingId, subject, description, againstId, againstType, priority } = req.body;

  const complaint = await Complaint.create({
    raisedBy: req.user._id,
    booking: bookingId || undefined,
    against: { entityId: againstId, entityType: againstType },
    subject,
    description,
    priority: priority || 'medium',
  });

  // Upload attachments if any
  if (req.files?.length) {
    const uploaded = await Promise.all(
      req.files.map(async (file) => {
        const { url, publicId } = await uploadDocument(file.buffer, 'complaints');
        return { name: file.originalname, url, publicId };
      })
    );
    complaint.attachments = uploaded;
    await complaint.save();
  }

  successResponse(res, 201, 'Complaint raised successfully', complaint);
});

// ─── Get My Complaints ────────────────────────────────────────────────────────
const getMyComplaints = asyncHandler(async (req, res) => {
  const { docs, pagination } = await paginate(Complaint, { raisedBy: req.user._id }, {
    page: req.query.page,
    limit: req.query.limit,
    sort: { createdAt: -1 },
  });
  paginatedResponse(res, 200, 'Complaints fetched', docs, pagination);
});

// ─── Admin: Get All Complaints ────────────────────────────────────────────────
const getAllComplaints = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const { docs, pagination } = await paginate(Complaint, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: { path: 'raisedBy', select: 'name email' },
  });
  paginatedResponse(res, 200, 'All complaints fetched', docs, pagination);
});

// ─── Admin: Resolve Complaint ─────────────────────────────────────────────────
const resolveComplaint = asyncHandler(async (req, res) => {
  const { adminNote, status } = req.body;

  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    {
      status: status || 'resolved',
      adminNote: adminNote || '',
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    },
    { new: true }
  );
  if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

  if (req.io) {
    await notifications.complaintResolved(req.io, complaint.raisedBy, complaint._id);
  }

  successResponse(res, 200, 'Complaint resolved', complaint);
});

module.exports = { raiseComplaint, getMyComplaints, getAllComplaints, resolveComplaint };
