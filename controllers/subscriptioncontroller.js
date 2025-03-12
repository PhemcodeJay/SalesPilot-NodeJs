const { DateTime } = require('luxon');
const { Op } = require('sequelize');
const { Subscription, Plan } = require('../models');

/**
 * Check and deactivate expired subscriptions dynamically
 */
const checkAndDeactivateSubscriptions = async () => {
  try {
    const now = DateTime.now().toISODate();

    const expiredSubscriptions = await Subscription.findAll({
      where: {
        status: 'active',
        end_date: { [Op.lt]: now }  // Less than today's date
      }
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = 'inactive';
      await subscription.save();
      console.log(`Deactivated Subscription ID ${subscription.id} for User ID ${subscription.user_id}`);
    }
  } catch (error) {
    console.error('Error checking subscriptions:', error);
    throw error;
  }
};

/**
 * Create a new subscription
 */
const createSubscription = async (userId, tenantId, planId, paymentDetails) => {
  try {
    const plan = await Plan.findByPk(planId);
    if (!plan) throw new Error('Invalid subscription plan.');

    const startDate = DateTime.now();
    const endDate = startDate.plus({ days: plan.duration }).toISODate();

    const subscription = await Subscription.create({
      user_id: userId,
      tenant_id: tenantId,
      plan_id: planId,
      payment_details: paymentDetails,
      status: 'active',
      start_date: startDate.toISODate(),
      end_date: endDate,
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Subscription creation failed');
  }
};

/**
 * Get active subscriptions for a user within a tenant
 */
const getActiveSubscriptions = async (userId, tenantId) => {
  try {
    return await Subscription.findAll({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        status: 'active',
      },
      order: [['start_date', 'DESC']],
      include: [{ model: Plan, attributes: ['name', 'price', 'duration'] }],
    });
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    throw new Error('Unable to fetch active subscriptions');
  }
};

/**
 * Cancel a subscription by ID
 */
const cancelSubscription = async (subscriptionId, userId, tenantId) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        id: subscriptionId,
        user_id: userId,
        tenant_id: tenantId,
        status: 'active',
      },
    });

    if (!subscription) throw new Error('Subscription not found or already cancelled.');

    subscription.status = 'cancelled';
    await subscription.save();

    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw new Error('Subscription cancellation failed');
  }
};

/**
 * Create a free trial for a user
 */
const createFreeTrial = async (userId, tenantId) => {
  try {
    const trialPlan = await Plan.findOne({ where: { name: 'trial' } });
    if (!trialPlan) throw new Error('Trial plan not found');

    return await createSubscription(userId, tenantId, trialPlan.id, 'Free Trial');
  } catch (error) {
    console.error(`Error creating free trial for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Create a subscription with a default plan
 */
const createSubscriptionWithDefault = async (userId, tenantId, planName = 'trial') => {
  try {
    const plan = await Plan.findOne({ where: { name: planName } });
    if (!plan) throw new Error('Invalid subscription plan.');

    // Prevent multiple active subscriptions
    const activeSub = await Subscription.findOne({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        status: 'active',
      },
    });

    if (activeSub) throw new Error('User already has an active subscription.');

    return await createSubscription(userId, tenantId, plan.id, 'Default Plan Subscription');
  } catch (error) {
    console.error(`Error creating subscription for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Upgrade a user's subscription plan
 */
const upgradeSubscription = async (userId, tenantId, newPlanName) => {
  try {
    const newPlan = await Plan.findOne({ where: { name: newPlanName } });
    if (!newPlan) throw new Error('Invalid subscription plan.');

    const subscription = await Subscription.findOne({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        status: 'active',
      },
    });

    if (!subscription) throw new Error('No active subscription found.');

    subscription.plan_id = newPlan.id;
    subscription.end_date = DateTime.now().plus({ days: newPlan.duration }).toISODate();
    await subscription.save();

    return subscription;
  } catch (error) {
    console.error(`Error upgrading subscription for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Cancel a subscription by user ID
 */
const cancelSubscriptionByUserId = async (userId, tenantId) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        status: 'active',
      },
    });

    if (!subscription) throw new Error('No active subscription found.');

    subscription.status = 'cancelled';
    await subscription.save();

    return subscription;
  } catch (error) {
    console.error(`Error cancelling subscription for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get a user's subscription status with plan details
 */
const getSubscriptionStatus = async (userId, tenantId) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        status: 'active',
      },
      include: [{ model: Plan, attributes: ['name', 'price', 'duration'] }],
    });

    if (!subscription) throw new Error('No active subscription found.');

    return subscription;
  } catch (error) {
    console.error(`Error fetching subscription status for user ${userId}:`, error);
    throw error;
  }
};

// Export functions
module.exports = {
  checkAndDeactivateSubscriptions,
  createSubscription,
  getActiveSubscriptions,
  cancelSubscription,
  createFreeTrial,
  createSubscriptionWithDefault,
  upgradeSubscription,
  cancelSubscriptionByUserId,
  getSubscriptionStatus,
};
