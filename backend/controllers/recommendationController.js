const asyncHandler = require('../utils/asyncHandler');
const Caregiver = require('../models/Caregiver');
const RecommendationCache = require('../models/RecommendationCache');
const { successResponse } = require('../utils/responseHandler');

// Helper to calculate distance in km using Haversine formula
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// ─── Get AI Recommended Caregivers ───────────────────────────────────────────
// GET /api/caregivers/recommended
const getRecommendedCaregivers = asyncHandler(async (req, res) => {
  const { serviceType, city, lat, lng, language, forceRefresh } = req.query;

  // 1. Check Cache unless forced
  if (forceRefresh !== 'true') {
    const cached = await RecommendationCache.findOne({
      userId: req.user._id,
      serviceType: serviceType || { $exists: true },
      'location.city': city || { $exists: true },
      language: language || { $exists: true }
    }).populate({
      path: 'recommendations.caregiver',
      select: 'name profileImage serviceType experience rates avgRating location trustScore',
      populate: { path: 'trustScore', select: 'score grade' }
    });

    if (cached && cached.recommendations.length > 0) {
      console.log('⚡ Returning recommended caregivers from cache');
      return successResponse(res, 200, 'Recommended caregivers fetched (cached)', cached.recommendations);
    }
  }

  // 2. Fetch active, verified caregivers matching base criteria
  const query = { isVerified: true, isActive: true, isBanned: false };
  if (serviceType) query.serviceType = serviceType;
  if (city) query['location.city'] = new RegExp(city, 'i');

  const caregivers = await Caregiver.find(query).populate('trustScore', 'score');

  if (!caregivers.length) {
    return successResponse(res, 200, 'No caregivers found matching criteria', []);
  }

  // 3. Compute Recommendation Score for each caregiver
  const scoredCaregivers = caregivers.map((cg) => {
    // 30% - Trust Score
    const trustScoreVal = cg.trustScore?.score || 0;
    const normTrustScore = trustScoreVal / 100; // 0 - 1

    // 20% - Rating Score
    const normRating = (cg.avgRating || 0) / 5; // 0 - 1

    // 15% - Experience Score (Max 10 years for scoring)
    const normExp = Math.min((cg.experience || 0) / 10, 1); // 0 - 1

    // 15% - Distance Score (Max 50km for scoring)
    let normDistance = 0;
    if (lat && lng && cg.currentLocation && cg.currentLocation.coordinates && cg.currentLocation.coordinates.length === 2) {
      const cgLng = cg.currentLocation.coordinates[0];
      const cgLat = cg.currentLocation.coordinates[1];
      const distKm = getDistanceKm(parseFloat(lat), parseFloat(lng), cgLat, cgLng);
      normDistance = Math.max(1 - (distKm / 50), 0); // Closer is better, beyond 50km is 0
    } else if (city && cg.location?.city && cg.location.city.toLowerCase() === city.toLowerCase()) {
      normDistance = 0.8; // Fallback city match
    }

    // 10% - Skills (Hardcoded for simplicity in this version)
    const skillScore = 1; // Assuming qualified if they match service type

    // 5% - Language Match
    let langScore = 0;
    if (language && cg.languages?.includes(language)) {
      langScore = 1;
    } else if (!language) {
      langScore = 1; // Not filtering by language
    }

    // 5% - Availability
    const availScore = cg.availability === 'available' ? 1 : 0;

    // Total Score (0-100)
    const recommendationScore = Math.round(
      (normTrustScore * 0.30 +
        normRating * 0.20 +
        normExp * 0.15 +
        normDistance * 0.15 +
        skillScore * 0.10 +
        langScore * 0.05 +
        availScore * 0.05) * 100
    );

    return {
      caregiver: cg,
      score: recommendationScore,
      breakdown: {
        trustScore: normTrustScore,
        distanceScore: normDistance,
        experienceScore: normExp,
        ratingScore: normRating,
        skillScore,
        languageScore: langScore,
        availabilityScore: availScore
      }
    };
  });

  // 4. Sort by highest score
  scoredCaregivers.sort((a, b) => b.score - a.score);

  // Take top 20
  const topRecommendations = scoredCaregivers.slice(0, 20);

  // 5. Cache the results
  const cacheEntry = await RecommendationCache.findOneAndUpdate(
    { userId: req.user._id },
    {
      userId: req.user._id,
      serviceType: serviceType || '',
      location: { city: city || '', lat: parseFloat(lat), lng: parseFloat(lng) },
      language: language || '',
      recommendations: topRecommendations.map(r => ({
        caregiver: r.caregiver._id,
        score: r.score,
        breakdown: r.breakdown
      })),
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Format response matching the cached populated version structure
  const responseData = topRecommendations.map(r => ({
    caregiver: r.caregiver,
    score: r.score,
    breakdown: r.breakdown
  }));

  successResponse(res, 200, 'Recommended caregivers generated and cached', responseData);
});

module.exports = {
  getRecommendedCaregivers
};
