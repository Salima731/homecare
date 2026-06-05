const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Caregiver name is required'],
      trim: true,
    },
    serviceType: {
      type: String,
      enum: ['babysitter', 'nurse', 'elder_care', 'special_needs'],
      required: [true, 'Service type is required'],
    },
    bio: {
      type: String,
      maxlength: [800, 'Bio cannot exceed 800 characters'],
    },
    experience: {
      type: Number,
      required: [true, 'Experience in years is required'],
      min: 0,
      max: 50,
    },
    rates: {
      hourly: { type: Number, default: 0 },
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
    },
    idProofs: [
      {
        name: { type: String },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    certificates: [
      {
        name: { type: String },
        url: { type: String },
        publicId: { type: String },
      },
    ],
    introVideo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    profileImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    location: {
      city: String,
      state: String,
      country: String,
    },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      updatedAt: { type: Date },
    },
    availability: {
      type: String,
      enum: ['available', 'on_duty', 'off_duty', 'on_leave'],
      default: 'available',
    },
    faceEmbedding: { type: String, default: '' },
    attendanceStats: {
      totalDays: { type: Number, default: 0 },
      lateDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
    },
    languages: [{ type: String }],
    specializations: [{ type: String }],
    trustScore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustScore',
    },
    totalEarnings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

caregiverSchema.index({ agency: 1 });
caregiverSchema.index({ serviceType: 1 });
caregiverSchema.index({ isVerified: 1, isActive: 1 });
caregiverSchema.index({ 'location.city': 1 });
caregiverSchema.index({ name: 'text', bio: 'text' });
caregiverSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Caregiver', caregiverSchema);
