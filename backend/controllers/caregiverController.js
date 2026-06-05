const asyncHandler = require('express-async-handler');
const Caregiver = require('../models/Caregiver');
const Agency = require('../models/Agency');
const TrustScore = require('../models/TrustScore');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const APIFeatures = require('../utils/apiFeatures');
const {
  uploadAvatar,
  uploadDocument,
  uploadVideo,
  deleteFromCloudinary,
} = require('../services/cloudinaryService');
const { calculateTrustScore } = require('../services/trustScoreService');

// ─── Create Caregiver Profile ─────────────────────────────────────────────────
const createProfile = asyncHandler(async (req, res) => {
  const {
    name, serviceType, bio, experience,
    hourlyRate, dailyRate, weeklyRate, monthlyRate,
    location, languages, specializations, agencyId,
  } = req.body;

  const existing = await Caregiver.findOne({ user: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('Caregiver profile already exists');
  }

  // Verify agency exists and is approved
  const agency = await Agency.findById(agencyId);
  if (!agency || agency.status !== 'approved') {
    res.status(400);
    throw new Error('Invalid or unapproved agency');
  }

  const caregiver = await Caregiver.create({
    user: req.user._id,
    agency: agencyId,
    name,
    serviceType,
    bio,
    experience: Number(experience),
    rates: {
      hourly: Number(hourlyRate) || 0,
      daily: Number(dailyRate) || 0,
      weekly: Number(weeklyRate) || 0,
      monthly: Number(monthlyRate) || 0,
    },
    location: location ? (typeof location === 'string' ? JSON.parse(location) : location) : {},
    languages: languages ? (typeof languages === 'string' ? JSON.parse(languages) : languages) : [],
    specializations: specializations
      ? (typeof specializations === 'string' ? JSON.parse(specializations) : specializations)
      : [],
  });

  // Initialize trust score
  await TrustScore.create({ caregiver: caregiver._id });
  await Agency.findByIdAndUpdate(agencyId, { $inc: { caregiverCount: 1 } });

  successResponse(res, 201, 'Caregiver profile created', caregiver);
});

// ─── Get My Profile ───────────────────────────────────────────────────────────
const getMyProfile = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findOne({ user: req.user._id })
    .populate('agency', 'agencyName status logo')
    .populate('trustScore');
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }
  successResponse(res, 200, 'Profile fetched', caregiver);
});

// ─── Update My Profile ────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, experience, location, languages, specializations } = req.body;

  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  if (name) caregiver.name = name;
  if (bio) caregiver.bio = bio;
  if (experience !== undefined) caregiver.experience = Number(experience);
  if (location) caregiver.location = typeof location === 'string' ? JSON.parse(location) : location;
  if (languages) caregiver.languages = typeof languages === 'string' ? JSON.parse(languages) : languages;
  if (specializations) caregiver.specializations = typeof specializations === 'string' ? JSON.parse(specializations) : specializations;

  if (req.body.hourlyRate !== undefined) caregiver.rates.hourly = Number(req.body.hourlyRate);
  if (req.body.dailyRate !== undefined) caregiver.rates.daily = Number(req.body.dailyRate);
  if (req.body.weeklyRate !== undefined) caregiver.rates.weekly = Number(req.body.weeklyRate);
  if (req.body.monthlyRate !== undefined) caregiver.rates.monthly = Number(req.body.monthlyRate);

  const updated = await caregiver.save();
  successResponse(res, 200, 'Profile updated', updated);
});

// ─── Upload Profile Image ─────────────────────────────────────────────────────
const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found'); }

  if (caregiver.profileImage?.publicId) {
    await deleteFromCloudinary(caregiver.profileImage.publicId);
  }
  const { url, publicId } = await uploadAvatar(req.file.buffer);
  caregiver.profileImage = { url, publicId };
  await caregiver.save();

  successResponse(res, 200, 'Profile image uploaded', { url, publicId });
});

// ─── Upload ID Proofs ─────────────────────────────────────────────────────────
const uploadIdProofs = asyncHandler(async (req, res) => {
  if (!req.files?.length) { res.status(400); throw new Error('No files uploaded'); }

  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found'); }

  const uploaded = await Promise.all(
    req.files.map(async (file) => {
      const { url, publicId } = await uploadDocument(file.buffer, 'id-proofs');
      return { name: file.originalname, url, publicId };
    })
  );
  caregiver.idProofs.push(...uploaded);
  await caregiver.save();

  successResponse(res, 200, 'ID proofs uploaded', caregiver.idProofs);
});

// ─── Upload Intro Video ───────────────────────────────────────────────────────
const uploadIntroVideo = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No video uploaded'); }

  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found'); }

  if (caregiver.introVideo?.publicId) {
    await deleteFromCloudinary(caregiver.introVideo.publicId, 'video');
  }
  const { url, publicId } = await uploadVideo(req.file.buffer);
  caregiver.introVideo = { url, publicId };
  await caregiver.save();

  successResponse(res, 200, 'Intro video uploaded', { url, publicId });
});

// ─── Search Caregivers (Public) ───────────────────────────────────────────────
const searchCaregivers = asyncHandler(async (req, res) => {
  const { serviceType, minRating, maxRate, experience, city, search, sort } = req.query;

  // Security: Only show caregivers from approved agencies
  const approvedAgencies = await Agency.find({ status: 'approved' }).select('_id');
  const approvedAgencyIds = approvedAgencies.map(a => a._id);

  const filter = { 
    isVerified: true, 
    isActive: true, 
    isBanned: false,
    agency: { $in: approvedAgencyIds } 
  };

  if (serviceType) filter.serviceType = serviceType;
  if (minRating) filter.avgRating = { $gte: parseFloat(minRating) };
  if (maxRate) filter['rates.hourly'] = { $lte: parseFloat(maxRate) };
  if (experience) filter.experience = { $gte: parseInt(experience, 10) };
  if (city) filter['location.city'] = new RegExp(city, 'i');

  console.log('🔍 Search Filters:', JSON.stringify(filter, null, 2));

  let query = Caregiver.find(filter)
    .populate('agency', 'agencyName logo status')
    .populate('trustScore', 'score grade');

  if (search) {
    query = Caregiver.find({
      ...filter,
      $or: [
        { name: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') },
        { specializations: new RegExp(search, 'i') },
      ],
    })
      .populate('agency', 'agencyName logo status')
      .populate('trustScore', 'score grade');
  }

  // Sorting
  const sortMap = {
    rating: '-avgRating',
    price_asc: 'rates.hourly',
    price_desc: '-rates.hourly',
    experience: '-experience',
    trust: '-trustScore.score',
    newest: '-createdAt',
  };
  query = query.sort(sortMap[sort] || '-createdAt');

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [caregivers, total] = await Promise.all([
    query.skip(skip).limit(limit),
    Caregiver.countDocuments(filter),
  ]);

  paginatedResponse(res, 200, 'Caregivers fetched', caregivers, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// ─── Get Single Caregiver (Public) ────────────────────────────────────────────
const getCaregiverById = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findById(req.params.id)
    .populate('agency', 'agencyName logo status rating')
    .populate('trustScore');
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found'); }
  successResponse(res, 200, 'Caregiver fetched', caregiver);
});

// ─── Agency: Verify Caregiver ─────────────────────────────────────────────────
const verifyCaregiver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verify } = req.body; // true/false

  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) { res.status(404); throw new Error('Agency not found'); }

  const caregiver = await Caregiver.findOne({ _id: id, agency: agency._id });
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found in your agency'); }

  caregiver.isVerified = verify !== false;
  await caregiver.save();

  successResponse(res, 200, `Caregiver ${caregiver.isVerified ? 'verified' : 'unverified'}`, caregiver);
});

// ─── Get Trust Score ──────────────────────────────────────────────────────────
const getTrustScore = asyncHandler(async (req, res) => {
  const trustScore = await TrustScore.findOne({ caregiver: req.params.id });
  if (!trustScore) { res.status(404); throw new Error('Trust score not found'); }
  successResponse(res, 200, 'Trust score fetched', trustScore);
});

// ─── Refresh Trust Score ──────────────────────────────────────────────────────
const refreshTrustScore = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found'); }
  const score = await calculateTrustScore(caregiver._id.toString());
  successResponse(res, 200, 'Trust score recalculated', score);
});

// ─── Caregiver: Get Dashboard Stats & Schedule ───────────────────────────────
const getCaregiverDashboard = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findOne({ user: req.user._id }).populate('trustScore');
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's schedule from Bookings
  console.log(`📊 Fetching dashboard for caregiver: ${caregiver._id}`);
  const todaysBookings = await Booking.find({
    caregiver: caregiver._id,
    status: { $in: ['assigned', 'ongoing'] },
    startDate: { $lt: tomorrow },
    endDate: { $gte: today }
  }).populate('user', 'name');
  console.log(`✅ Today's bookings fetched: ${todaysBookings.length}`);

  // Weekly availability
  const weeklyAvailability = await Schedule.find({
    caregiver: caregiver._id,
    date: { $gte: today, $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) }
  }).sort({ date: 1 });
  console.log(`✅ Weekly availability fetched: ${weeklyAvailability.length}`);

  const activeJobs = await Booking.countDocuments({
    caregiver: caregiver._id,
    status: { $in: ['assigned', 'ongoing'] }
  });
  console.log(`✅ Active jobs count: ${activeJobs}`);

  const completionRate = caregiver.completedBookings + caregiver.cancelledBookings > 0
    ? Math.round((caregiver.completedBookings / (caregiver.completedBookings + caregiver.cancelledBookings)) * 100)
    : 100;

  successResponse(res, 200, 'Caregiver dashboard data fetched', {
    caregiver,
    stats: {
      activeJobs,
      monthlyEarnings: caregiver.totalEarnings || 0,
      rating: caregiver.avgRating || 0,
      completionRate,
    },
    todaysBookings,
    weeklyAvailability
  });
});

// ─── Agency: Get My Caregivers ────────────────────────────────────────────────
const getMyCaregivers = asyncHandler(async (req, res) => {
  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) {
    return paginatedResponse(res, 200, 'Agency profile not found', [], { page: 1, limit: 10, totalPages: 0, totalDocs: 0 });
  }

  const { docs, pagination } = await paginate(
    Caregiver,
    { agency: agency._id },
    { page: req.query.page, limit: req.query.limit, populate: ['trustScore', 'user'] }
  );
  paginatedResponse(res, 200, 'Caregivers fetched', docs, pagination);
});

// ─── Caregiver: Get Earnings ──────────────────────────────────────────────────
const getCaregiverEarnings = asyncHandler(async (req, res) => {
  const Payment = require('../models/Payment');
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  const payments = await Payment.find({ caregiver: caregiver._id, status: 'completed' })
    .populate('booking', 'startDate endDate serviceType durationType')
    .sort({ createdAt: -1 });

  const totalEarned = payments.reduce((acc, p) => acc + p.agencyAmount, 0); // Assuming agencyAmount is what caregiver gets for now

  successResponse(res, 200, 'Earnings fetched', {
    totalEarned,
    completedBookings: caregiver.completedBookings,
    payments
  });
});

// ─── Caregiver: Get My Reviews ────────────────────────────────────────────────
const getMyReviews = asyncHandler(async (req, res) => {
  const Review = require('../models/Review');
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  const reviews = await Review.find({ caregiver: caregiver._id, isHidden: false })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  successResponse(res, 200, 'Reviews fetched', reviews);
});

// ─── Agency: Add Caregiver Directly ──────────────────────────────────────────
const addCaregiverByAgency = asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const { name, email, password, phone, serviceType, experience, hourlyRate } = req.body;

  // 1. Get Agency
  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) {
    res.status(404);
    throw new Error('Agency profile not found');
  }

  // 2. Create User Account
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  console.log(`👤 Creating user for ${email}...`);
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: 'caregiver',
    isEmailVerified: true,
  });
  console.log(`✅ User created: ${user._id}`);

  console.log(`🏥 Creating caregiver profile for agency ${agency._id}...`);
  const caregiver = new Caregiver({
    user: user._id,
    agency: agency._id,
    name,
    serviceType: serviceType || 'nurse',
    experience: Number(experience) || 0,
    rates: {
      hourly: Number(hourlyRate) || 0,
    },
    isVerified: true,
  });

  // Handle file uploads (profileImage and idProofs)
  if (req.files) {
    // 1. Profile Image
    if (req.files.profileImage && req.files.profileImage.length > 0) {
      console.log('🖼️ Uploading profile image...');
      const { url, publicId } = await uploadAvatar(req.files.profileImage[0].buffer);
      const imgData = { url, publicId };
      
      // Update Caregiver profileImage
      caregiver.profileImage = imgData;
      
      // Update User avatar
      await User.findByIdAndUpdate(user._id, { avatar: imgData });
    }

    // 2. ID Proofs
    if (req.files.idProofs && req.files.idProofs.length > 0) {
      console.log('📄 Uploading ID proofs...');
      const uploaded = await Promise.all(
        req.files.idProofs.map(async (file) => {
          const { url, publicId } = await uploadDocument(file.buffer, 'id_proofs');
          return { name: file.originalname, url, publicId };
        })
      );
      caregiver.idProofs = uploaded;
    }
  }

  await caregiver.save();
  console.log(`✅ Caregiver created: ${caregiver._id}`);

  await TrustScore.create({ caregiver: caregiver._id });
  await Agency.findByIdAndUpdate(agency._id, { $inc: { caregiverCount: 1 } });
  console.log(`📈 Agency caregiver count incremented`);

  successResponse(res, 201, 'Caregiver account and profile created successfully', {
    user: { _id: user._id, name: user.name, email: user.email },
    caregiver
  });
});

// ─── Agency: Toggle Caregiver Active Status ────────────────────────────────────
const toggleCaregiverStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body; // true/false

  const agency = await Agency.findOne({ user: req.user._id });
  if (!agency) { res.status(404); throw new Error('Agency not found'); }

  const caregiver = await Caregiver.findOne({ _id: id, agency: agency._id });
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found in your agency'); }

  caregiver.isActive = isActive !== false;
  await caregiver.save();

  successResponse(res, 200, `Caregiver ${caregiver.isActive ? 'enabled' : 'disabled'}`, caregiver);
});

module.exports = {
  createProfile,
  getMyProfile,
  updateProfile,
  uploadProfileImage,
  uploadIdProofs,
  uploadIntroVideo,
  searchCaregivers,
  getCaregiverById,
  verifyCaregiver,
  toggleCaregiverStatus,
  getTrustScore,
  refreshTrustScore,
  getMyCaregivers,
  getCaregiverDashboard,
  getCaregiverEarnings,
  getMyReviews,
  addCaregiverByAgency,
};
