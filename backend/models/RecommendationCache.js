const mongoose = require('mongoose');

const recommendationCacheSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: String,
  location: { city: String, lat: Number, lng: Number },
  language: String,
  recommendations: [{
    caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver' },
    score: Number,
    breakdown: {
      trustScore: Number,
      distanceScore: Number,
      experienceScore: Number,
      ratingScore: Number,
      skillScore: Number,
      languageScore: Number,
      availabilityScore: Number,
    },
  }],
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) }, // 30 min TTL
}, { timestamps: true });

recommendationCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RecommendationCache', recommendationCacheSchema);
