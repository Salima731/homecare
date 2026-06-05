const asyncHandler = require('express-async-handler');
const Schedule = require('../models/Schedule');
const Caregiver = require('../models/Caregiver');
const { successResponse } = require('../utils/responseHandler');

// ─── Set / Update Availability ────────────────────────────────────────────────
const setAvailability = asyncHandler(async (req, res) => {
  const { date, slots, isAvailable, note } = req.body;

  // Find caregiver by user ID (ensuring it's the current user)
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  
  if (!caregiver) {
    console.log(`❌ Availability Update Failed: Caregiver profile not found for User ${req.user._id}`);
    res.status(404);
    throw new Error('Your caregiver profile was not found. Please complete your profile setup.');
  }

  const schedule = await Schedule.findOneAndUpdate(
    { caregiver: caregiver._id, date: new Date(date) },
    { slots: slots || [], isAvailable: isAvailable !== false, note: note || '' },
    { upsert: true, new: true, runValidators: true }
  );

  successResponse(res, 200, 'Availability updated', schedule);
});

// ─── Get Caregiver Availability (Public) ──────────────────────────────────────
const getAvailability = asyncHandler(async (req, res) => {
  const { caregiverId } = req.params;
  const { from, to } = req.query;

  const filter = { caregiver: caregiverId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const schedules = await Schedule.find(filter).sort({ date: 1 });
  successResponse(res, 200, 'Availability fetched', schedules);
});

// ─── Get My Schedule (Caregiver) ──────────────────────────────────────────────
const getMySchedule = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found'); }

  const schedules = await Schedule.find({ caregiver: caregiver._id })
    .sort({ date: 1 });

  successResponse(res, 200, 'Schedule fetched', schedules);
});

// ─── Delete a Schedule Slot ───────────────────────────────────────────────────
const deleteSchedule = asyncHandler(async (req, res) => {
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) { res.status(404); throw new Error('Caregiver not found'); }

  await Schedule.findOneAndDelete({ _id: req.params.id, caregiver: caregiver._id });
  successResponse(res, 200, 'Schedule deleted');
});

module.exports = { setAvailability, getAvailability, getMySchedule, deleteSchedule };
