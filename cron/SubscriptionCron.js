const cron = require('node-cron');
const Subscription = require('../models/subscription');

cron.schedule('0 0 1 * *', async () => {
  const subscriptions = await Subscription.findAll({
    where: {
      status: 'Active',
      end_date: { [Op.lt]: new Date() },
    },
  });

  subscriptions.forEach(async (subscription) => {
    await subscription.update({ status: 'Expired' });
  });
});
