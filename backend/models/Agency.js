const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    agencyName: {
      type: String,
      required: [true, 'Agency name is required'],
      trim: true,
      maxlength: [150, 'Agency name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    documents: [
      {
        name: { type: String },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    website: { type: String, trim: true },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    totalEarnings: { type: Number, default: 0 },
    totalPayout: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    caregiverCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

agencySchema.index({ status: 1 });
agencySchema.index({ agencyName: 'text' });

module.exports = mongoose.model('Agency', agencySchema);
