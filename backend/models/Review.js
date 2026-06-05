const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // One review per booking
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
      required: true,
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    ratings: {
      punctuality: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      behavior: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      skill: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      overall: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
    },
    comment: {
      type: String,
      maxlength: [600, 'Review comment cannot exceed 600 characters'],
    },
    isVerified: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false }, // Admin can hide reviews
  },
  { timestamps: true }
);

reviewSchema.index({ caregiver: 1 });
reviewSchema.index({ agency: 1 });
reviewSchema.index({ user: 1 });

// Auto-calculate average rating fields on the caregiver after save
reviewSchema.post('save', async function () {
  const Caregiver = mongoose.model('Caregiver');
  const reviews = await this.constructor.find({ caregiver: this.caregiver });
  const avgRating =
    reviews.reduce((acc, r) => acc + r.ratings.overall, 0) / reviews.length;
  await Caregiver.findByIdAndUpdate(this.caregiver, {
    avgRating: isNaN(avgRating) ? 0 : parseFloat(avgRating.toFixed(2)),
    reviewCount: reviews.length,
  });
});

module.exports = mongoose.model('Review', reviewSchema);
