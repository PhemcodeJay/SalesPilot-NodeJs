const cron = require('node-cron');
const { Op } = require('sequelize');
const Subscription = require('../models/subscription');
const { renewSubscriptions } = require('../services/subscriptionService'); // Assuming you have the renewSubscriptions logic in subscriptionService.js

// Schedule the job to run at midnight on the 1st day of every month
cron.schedule('0 0 1 * *', async () => {
  try {
    // Check for expired subscriptions
    const expiredSubscriptions = await Subscription.findAll({
      where: {
        status: 'Active',
        end_date: { [Op.lt]: new Date() }, // Subscriptions that have expired
      },
    });

    // Mark expired subscriptions as 'Expired'
    for (const subscription of expiredSubscriptions) {
      await subscription.update({ status: 'Expired' });
      console.log(`Subscription for tenant ${subscription.tenant_id} has expired.`);
    }

    // Now, run renewal logic for subscriptions that can be renewed
    await renewSubscriptions();
    console.log('✅ Renewal process completed for expired subscriptions');
  } catch (err) {
    console.error('❌ Error running cron job for subscription renewal:', err.message);
  }
});
