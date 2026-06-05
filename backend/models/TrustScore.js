const mongoose = require('mongoose');

const trustScoreSchema = new mongoose.Schema(
  {
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
      required: true,
      unique: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
      default: 'F',
    },
    breakdown: {
      completedBookings: { type: Number, default: 0 }, // raw count
      avgRating: { type: Number, default: 0 },         // 0-5
      experience: { type: Number, default: 0 },        // years
      complaintRatio: { type: Number, default: 0 },    // 0-1 (lower is better)
      cancellationRatio: { type: Number, default: 0 }, // 0-1 (lower is better)
      punctualityRatio: { type: Number, default: 0 },  // 0-1 (higher is better)
    },
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

trustScoreSchema.index({ score: -1 });

/**
 * Compute grade from score
 */
trustScoreSchema.methods.computeGrade = function () {
  const s = this.score;
  if (s >= 90) return 'A+';
  if (s >= 80) return 'A';
  if (s >= 70) return 'B+';
  if (s >= 60) return 'B';
  if (s >= 50) return 'C';
  if (s >= 35) return 'D';
  return 'F';
};

module.exports = mongoose.model('TrustScore', trustScoreSchema);
