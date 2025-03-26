const { SubscriptionService } = require('../models/subscription');

// Create a new subscription
await SubscriptionService.createSubscription({
  user_id: 1,
  plan_id: 2,
  status: 'active',
  start_date: new Date(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  is_free_trial: false,
  payment_details: { transaction_id: '12345', method: 'credit_card' },
});

// Fetch all subscriptions
const subscriptions = await SubscriptionService.getAllSubscriptions();

// Update a subscription
await SubscriptionService.updateSubscription(1, { status: 'cancelled' });

// Delete a subscription
await SubscriptionService.deleteSubscription(1);
