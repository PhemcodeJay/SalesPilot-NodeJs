const cron = require('node-cron');
const { logError } = require('../utils/logger');
const { deleteExpiredActivationCodes } = require('../utils/emailUtils');

// Run every hour (at the 0th minute)
cron.schedule('0 * * * *', async () => {
  try {
    const deletedCount = await deleteExpiredActivationCodes();
    console.log(`[CleanupJob] Deleted ${deletedCount} expired activation code(s).`);
  } catch (err) {
    logError('[CleanupJob] Failed to delete expired activation codes', err);
  }
});
