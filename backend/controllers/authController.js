const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const Hospital = require('../models/Hospital');
const FamilyMember = require('../models/FamilyMember');
const { generateAccessToken, sendAccessToken } = require('../utils/generateToken');
const { generateRefreshToken, sendRefreshToken } = require('../utils/generateRefreshToken');
const { successResponse } = require('../utils/responseHandler');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

// ─── OTP Registration ───────────────────────────────────────────────────────────
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');

const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }
  
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await OTP.deleteMany({ email });
  await OTP.create({ email, otp: otpCode });
  
  await sendEmail({
    email,
    subject: 'CareConnect - Verification Code',
    message: `Your verification OTP is: ${otpCode}. It will expire in 5 minutes.`
  });
  
  successResponse(res, 200, 'OTP sent to email successfully');
});

// ─── Register ─────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role, otp } = req.body;

  // Only allow user/agency/caregiver/hospital/family self-registration; admin is seeded
  const allowedRoles = ['user', 'agency', 'caregiver', 'hospital', 'family'];
  if (role && !allowedRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role selected');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // OTP Validation
  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord || otpRecord.otp !== otp) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  await OTP.deleteOne({ email });

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'user',
    isEmailVerified: true,
  });

  if (role === 'hospital') {
    await Hospital.create({
      user: user._id,
      hospitalName: name,
      registrationNumber: `PENDING-${user._id.toString().substring(0, 8)}`,
    });
  } else if (role === 'family') {
    await FamilyMember.create({
      user: user._id,
      name,
      relationship: 'other', // Will be updated in profile setup
    });
  }
  // 'user' role no longer creates a separate Patient document

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  sendAccessToken(res, accessToken);
  sendRefreshToken(res, refreshToken);

  successResponse(res, 201, 'Registration successful.', {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: true,
    },
    token: accessToken,
  });
});

// ─── Google Auth ──────────────────────────────────────────────────────────────
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = asyncHandler(async (req, res) => {
  const { token, role } = req.body;
  console.log('🔄 Google Auth attempt started...');
  
  if (!token) {
    console.log('❌ No Google token provided');
    res.status(400);
    throw new Error('Google token is required');
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub, email, name, picture } = ticket.getPayload();
    console.log(`✅ Google token verified for email: ${email}`);

    let user = await User.findOne({ email }).select('+password +refreshToken');
    
    if (!user) {
      console.log('👤 Creating new user from Google profile...');
      const assignedRole = role || 'user';
      user = await User.create({
        name,
        email,
        googleId: sub,
        password: crypto.randomBytes(16).toString('hex'), 
        role: assignedRole,
        isEmailVerified: true,
        avatar: { url: picture, publicId: 'google-auth' }
      });
      
      // 'user' role no longer creates a separate Patient document
    } else if (!user.googleId) {
      user.googleId = sub;
      await user.save({ validateBeforeSave: false });
    }

    if (user.isBanned) {
      console.log('🚫 User is banned');
      res.status(403);
      throw new Error('Your account has been banned. Contact support.');
    }

    // Check if caregiver is active
    if (user.role === 'caregiver') {
      const caregiver = await Caregiver.findOne({ user: user._id });
      if (caregiver && !caregiver.isActive) {
        console.log('🚫 Caregiver is inactive');
        res.status(403);
        throw new Error('Your caregiver account has been deactivated by the agency. Please contact your agency.');
      }
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendAccessToken(res, accessToken);
    sendRefreshToken(res, refreshToken);

    console.log('🚀 Google Auth successful!');
    successResponse(res, 200, 'Google Login successful', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
      token: accessToken,
    });
  } catch (err) {
    console.error('❌ Google Auth Error:', err.message);
    res.status(401);
    throw new Error('Google authentication failed: ' + err.message);
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !user.password) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isEmailVerified) {
    res.status(403);
    throw new Error('Please verify your email before logging in');
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('Your account has been banned. Contact support.');
  }

  // Check if caregiver is active
  if (user.role === 'caregiver') {
    const caregiver = await Caregiver.findOne({ user: user._id });
    if (caregiver && !caregiver.isActive) {
      res.status(403);
      throw new Error('Your caregiver account has been deactivated by the agency. Please contact your agency.');
    }
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendAccessToken(res, accessToken);
  sendRefreshToken(res, refreshToken);

  successResponse(res, 200, 'Login successful', {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
    token: accessToken,
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    await User.findOneAndUpdate(
      { refreshToken },
      { refreshToken: '' },
      { validateBeforeSave: false }
    );
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh-token' });

  successResponse(res, 200, 'Logged out successfully');
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    res.status(401);
    throw new Error('No refresh token found');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    res.status(401);
    throw new Error('Refresh token mismatch — please login again');
  }

  const newAccessToken = generateAccessToken(user._id);
  sendAccessToken(res, newAccessToken);

  successResponse(res, 200, 'Token refreshed', { accessToken: newAccessToken });
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerifyToken: token,
    emailVerifyExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification link');
  }

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });

  successResponse(res, 200, 'Email verified successfully');
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return successResponse(res, 200, 'If an account exists, a reset link has been sent.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(email, user.name, resetToken);

  successResponse(res, 200, 'Password reset email sent');
});

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  successResponse(res, 200, 'Password reset successful. Please login.');
});

// ─── Get Current User ─────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  successResponse(res, 200, 'User fetched', user);
});

module.exports = {
  sendOTP,
  register,
  googleAuth,
  login,
  logout,
  refreshAccessToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
};
