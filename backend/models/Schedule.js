const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "17:00"
    isBooked: { type: Boolean, default: false },
    bookingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    slots: [slotSchema],
    isAvailable: { type: Boolean, default: true },
    note: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

// Compound unique: one schedule doc per caregiver per day
scheduleSchema.index({ caregiver: 1, date: 1 }, { unique: true });
scheduleSchema.index({ caregiver: 1, isAvailable: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
