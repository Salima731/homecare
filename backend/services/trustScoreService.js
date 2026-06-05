const TrustScore = require('../models/TrustScore');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Complaint = require('../models/Complaint');
const Caregiver = require('../models/Caregiver');

/**
 * Trust Score Algorithm
 *
 * Score = (
 *   normalizedBookings * 0.30 +
 *   normalizedRating   * 0.25 +
 *   normalizedExp      * 0.20 +
 *   punctualityRatio   * 0.15 +
 *   (1 - complaintRatio)  * 0.05 +
 *   (1 - cancellationRatio) * 0.05
 * ) * 100
 *
 * All factors normalized 0–1 before weighting.
 */

const MAX_BOOKINGS = 100; // Benchmark: 100 completed bookings = max score
const MAX_EXPERIENCE = 10; // 10 years = max score

const normalize = (value, max) => Math.min(value / max, 1);

const computeGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
};

/**
 * Calculate and upsert trust score for a caregiver
 * @param {string} caregiverId
 */
const calculateTrustScore = async (caregiverId) => {
  const caregiver = await Caregiver.findById(caregiverId);
  if (!caregiver) throw new Error('Caregiver not found');

  // Fetch completed bookings
  const completedBookings = await Booking.countDocuments({
    caregiver: caregiverId,
    status: 'completed',
  });

  // Fetch cancelled bookings
  const cancelledBookings = await Booking.countDocuments({
    caregiver: caregiverId,
    status: 'cancelled',
  });

  // Total bookings attempted
  const totalAttempted = completedBookings + cancelledBookings;
  const cancellationRatio = totalAttempted > 0 ? cancelledBookings / totalAttempted : 0;

  // Avg rating from reviews
  const reviews = await Review.find({ caregiver: caregiverId });
  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.ratings.overall, 0) / reviews.length
    : 0;

  // Punctuality from ratings
  const avgPunctuality = reviews.length
    ? reviews.reduce((acc, r) => acc + r.ratings.punctuality, 0) / reviews.length
    : 0;
  const punctualityRatio = avgPunctuality / 5; // normalize 0-1

  // Complaints
  const complaints = await Complaint.countDocuments({
    'against.entityId': caregiverId,
    'against.entityType': 'Caregiver',
    status: { $in: ['open', 'in_review', 'resolved'] },
  });
  const complaintRatio = completedBookings > 0
    ? Math.min(complaints / completedBookings, 1)
    : 0;

  // Experience
  const experience = caregiver.experience || 0;

  // --- Weighted Score ---
  const score = Math.round(
    (normalize(completedBookings, MAX_BOOKINGS) * 0.30 +
      (avgRating / 5) * 0.25 +
      normalize(experience, MAX_EXPERIENCE) * 0.20 +
      punctualityRatio * 0.15 +
      (1 - complaintRatio) * 0.05 +
      (1 - cancellationRatio) * 0.05) * 100
  );

  const breakdown = {
    completedBookings,
    avgRating: parseFloat(avgRating.toFixed(2)),
    experience,
    complaintRatio: parseFloat(complaintRatio.toFixed(3)),
    cancellationRatio: parseFloat(cancellationRatio.toFixed(3)),
    punctualityRatio: parseFloat(punctualityRatio.toFixed(3)),
  };

  const grade = computeGrade(score);

  // Upsert trust score doc
  const trustScore = await TrustScore.findOneAndUpdate(
    { caregiver: caregiverId },
    { score, grade, breakdown, lastCalculated: new Date() },
    { upsert: true, new: true }
  );

  // Keep caregiver's trustScore reference synced
  await Caregiver.findByIdAndUpdate(caregiverId, {
    trustScore: trustScore._id,
  });

  return trustScore;
};

/**
 * Recalculate trust scores for ALL active caregivers (used by cron job)
 */
const recalculateAllTrustScores = async () => {
  const caregivers = await Caregiver.find({ isActive: true, isVerified: true });
  const results = await Promise.allSettled(
    caregivers.map((c) => calculateTrustScore(c._id.toString()))
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`✅ Trust scores updated: ${results.length - failed} success, ${failed} failed`);
};

module.exports = { calculateTrustScore, recalculateAllTrustScores };
