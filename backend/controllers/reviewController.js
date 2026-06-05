const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');

// ─── Create Review ────────────────────────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { bookingId, ratings, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('You can only review your own bookings');
  }
  if (booking.status !== 'completed') {
    res.status(400); throw new Error('You can only review completed bookings');
  }

  const exists = await Review.findOne({ booking: bookingId });
  if (exists) { res.status(400); throw new Error('Review already submitted for this booking'); }

  const review = await Review.create({
    booking: bookingId,
    user: req.user._id,
    caregiver: booking.caregiver,
    agency: booking.agency,
    ratings,
    comment,
  });

  successResponse(res, 201, 'Review submitted', review);
});

// ─── Get Reviews for a Caregiver ─────────────────────────────────────────────
const getCaregiverReviews = asyncHandler(async (req, res) => {
  const { docs, pagination } = await paginate(
    Review,
    { caregiver: req.params.id, isHidden: false },
    {
      page: req.query.page,
      limit: req.query.limit,
      populate: { path: 'user', select: 'name avatar' },
    }
  );
  paginatedResponse(res, 200, 'Reviews fetched', docs, pagination);
});

// ─── Get Reviews for an Agency ────────────────────────────────────────────────
const getAgencyReviews = asyncHandler(async (req, res) => {
  const { docs, pagination } = await paginate(
    Review,
    { agency: req.params.id, isHidden: false },
    {
      page: req.query.page,
      limit: req.query.limit,
      populate: { path: 'user', select: 'name avatar' },
    }
  );
  paginatedResponse(res, 200, 'Agency reviews fetched', docs, pagination);
});

// ─── Admin: Hide Review ───────────────────────────────────────────────────────
const hideReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isHidden: true },
    { new: true }
  );
  if (!review) { res.status(404); throw new Error('Review not found'); }
  successResponse(res, 200, 'Review hidden', review);
});

module.exports = { createReview, getCaregiverReviews, getAgencyReviews, hideReview };
