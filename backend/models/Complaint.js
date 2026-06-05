const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    against: {
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'against.entityType',
      },
      entityType: {
        type: String,
        enum: ['Caregiver', 'Agency', 'User'],
        required: true,
      },
    },
    subject: {
      type: String,
      required: [true, 'Complaint subject is required'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
    },
    attachments: [
      {
        name: String,
        url: String,
        publicId: String,
      },
    ],
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'closed'],
      default: 'open',
    },
    adminNote: { type: String, default: '' },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

complaintSchema.index({ raisedBy: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ 'against.entityId': 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
