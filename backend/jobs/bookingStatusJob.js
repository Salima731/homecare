const cron = require('node-cron');
const Booking = require('../models/Booking');

/**
 * Booking lifecycle is agency/caregiver driven:
 * pending -> accepted -> assigned -> ongoing -> completed.
 * This monitor intentionally does not auto-transition bookings.
 */
const startBookingStatusJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      await Booking.countDocuments({
        status: { $in: ['pending', 'accepted', 'assigned', 'ongoing'] },
      });
    } catch (err) {
      console.error('[CRON] bookingStatusJob error:', err.message);
    }
  });

  console.log('Booking status monitor started (no automatic lifecycle transitions)');
};

module.exports = { startBookingStatusJob };
