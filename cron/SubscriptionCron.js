const cron = require('node-cron');
const { Op } = require('sequelize');
const { models } = require('../config/db'); // Ensure Sequelize models are loaded correctly
const { renewSubscriptions } = require('../services/subscriptionService');
const { logError } = require('../utils/logger'); // Proper logger integration

// Schedule the job to run at midnight on the 1st of every month
cron.schedule('0 0 1 * *', async () => {
  console.log('📅 Cron job started: Checking for expired subscriptions');

  try {
    // Step 1: Find expired subscriptions
    const expiredSubscriptions = await models.Subscription.findAll({
      where: {
        status: 'Active',
        end_date: {
          [Op.lt]: new Date(), // Subscriptions past end_date
        },
      },
    });

    // Step 2: Mark them as expired
    for (const subscription of expiredSubscriptions) {
      await subscription.update({ status: 'Expired' });
      console.log(`⚠️ Subscription expired for tenant ${subscription.tenant_id}`);
    }

    // Step 3: Attempt to renew subscriptions (if applicable)
    await renewSubscriptions();
    console.log('✅ Renewal process completed for expired subscriptions');
  } catch (err) {
    logError('❌ Cron job error: Subscription renewal failed', err);
  }
});
