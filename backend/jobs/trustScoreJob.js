const cron = require('node-cron');
const Caregiver = require('../models/Caregiver');
const { recalculateAllTrustScores } = require('../services/trustScoreService');

/**
 * Cron job: Recalculate trust scores for all active caregivers
 * Runs every day at 2:00 AM
 */
const startTrustScoreJob = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [CRON] Recalculating trust scores...');
    try {
      await recalculateAllTrustScores();
    } catch (err) {
      console.error('❌ [CRON] trustScoreJob error:', err.message);
    }
  });

  console.log('✅ Trust score cron job started (daily at 2 AM)');
};

module.exports = { startTrustScoreJob };
