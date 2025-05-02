const cron = require('node-cron');
const { ActivationCode } = require('../models');
const { logError } = require('../utils/logger');

// Run every hour (0th minute)
cron.schedule('0 * * * *', async () => {
  try {
    const result = await ActivationCode.destroy({
      where: {
        expires_at: { lt: new Date() },
      },
    });

    console.log(`[CleanupJob] Deleted ${result} expired activation code(s)`);
  } catch (err) {
    logError('[CleanupJob] Failed to delete expired activation codes', err);
  }
});
