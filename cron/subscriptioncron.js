const { checkAndDeactivateSubscriptions } = require('../controllers/subscriptioncontroller');

(async function () {
  try {
    console.log('Running initial subscription check on server startup...');
    await checkAndDeactivateSubscriptions();
    console.log('Initial subscription check completed.');
  } catch (error) {
    console.error('Error during initial subscription check:', error.message);
  }
})();
