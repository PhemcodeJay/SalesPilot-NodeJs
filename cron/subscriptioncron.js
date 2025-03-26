const { checkAndDeactivateSubscriptions } = require("../controllers/subscriptioncontroller");

(async function runSubscriptionCheck() {
  console.log(`[${new Date().toISOString()}] 🔄 Running subscription check...`);

  try {
    await checkAndDeactivateSubscriptions();
    console.log(`[${new Date().toISOString()}] ✅ Subscription check completed successfully.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error during subscription check:`, error);
  } finally {
    console.log(`[${new Date().toISOString()}] 🛑 Subscription check process exiting.`);
    process.exit();
  }
})();

