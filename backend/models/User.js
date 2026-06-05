const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-]{7,15}$/, 'Please provide a valid phone number'],
    },
    role: {
      type: String,
      enum: ['admin', 'agency', 'caregiver', 'user', 'hospital', 'family', 'doctor'],
      default: 'user',
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isEmailVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    googleId: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    emailVerifyToken: String,
    emailVerifyExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    refreshToken: { type: String, select: false },
    lastLogin: Date,
    notificationSettings: {
      bookingConfirmations: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      exclusiveOffers: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      healthAlerts: { type: Boolean, default: true },
      emergencyAlerts: { type: Boolean, default: true },
      medicationReminders: { type: Boolean, default: true },
    },
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver'
    }],
    emergencyContacts: [{
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
      notifyOnSOS: { type: Boolean, default: true },
    }],

    // ─── Patient Profile Fields ───────────────────────────────────────────────
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
      default: 'unknown',
    },
    allergies: [String],
    chronicConditions: [String],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    assignedCaregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver' },
    assignedHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    familyMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' }],
    familyAccessCode: String,
    familyAccessCodeExpires: Date,
    insuranceProvider: String,
    insurancePolicyNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    profileImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ role: 1 });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.emailVerifyToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
