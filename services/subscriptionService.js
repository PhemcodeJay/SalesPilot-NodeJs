const { models } = require('../config/db');
const { Op } = require('sequelize');
const { logError } = require('../utils/logger');
const { generateActivationCode } = require('./ActivationCodeService'); // Optional: For new trial accounts

const PLANS = {
  trial: {
    durationMonths: 3,
    features: ['basic_reports'],
    price: 0,
  },
  starter: {
    durationMonths: 12,
    features: ['basic_reports', 'inventory_tracking'],
    price: 100,
  },
  business: {
    durationMonths: 12,
    features: ['basic_reports', 'inventory_tracking', 'sales_forecasting'],
    price: 250,
  },
  enterprise: {
    durationMonths: 12,
    features: ['basic_reports', 'inventory_tracking', 'sales_forecasting', 'multi_user_access'],
    price: 500,
  },
};

// Create a new subscription for a tenant (user and tenant info are treated as same)
const createSubscription = async (tenantId, plan = 'trial', transaction = null) => {
  const t = transaction || null;
  try {
    // Fetch Tenant
    const tenant = await models.Tenant.findByPk(tenantId, { transaction: t });
    if (!tenant) throw new Error(`Tenant not found for tenantId: ${tenantId}`);

    const planDetails = PLANS[plan];
    if (!planDetails) throw new Error(`Invalid subscription plan: ${plan}`);

    // Prevent duplicate free trial if the business logic requires multiple trials, adjust the check
    if (plan === 'trial') {
      const trialUsed = await models.Subscription.findOne({
        where: {
          tenant_id: tenantId,
          is_free_trial_used: true,
          status: { [Op.in]: ['Active', 'Pending', 'Expired'] },
        },
        transaction: t,
      });
      if (trialUsed) throw new Error('Free trial has already been used.');
    }

    // Check for active subscription
    const existingSubscription = await models.Subscription.findOne({
      where: {
        tenant_id: tenantId,
        status: { [Op.in]: ['Active', 'Pending'] },
      },
      order: [['created_at', 'DESC']],
      transaction: t,
    });

    if (existingSubscription && new Date(existingSubscription.end_date) > new Date()) {
      throw new Error('Tenant already has an active or pending subscription.');
    }

    // Calculate start and end dates for subscription
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(now.getMonth() + planDetails.durationMonths);

    // Create subscription record in the database
    const subscription = await models.Subscription.create(
      {
        tenant_id: tenant.id,
        subscription_plan: plan,
        start_date: now,
        end_date: endDate,
        status: 'Active',
        is_free_trial_used: plan === 'trial',
        features: JSON.stringify(planDetails.features),
        price: planDetails.price,
      },
      { transaction: t }
    );

    // Update tenant subscription-related data
    tenant.subscription_start_date = now;
    tenant.subscription_end_date = endDate;
    await tenant.save({ transaction: t });

    // If trial plan, generate activation code and send to tenant's user
    if (plan === 'trial') {
      const user = await models.User.findOne({ where: { tenant_id: tenantId }, transaction: t });
      if (user) await generateActivationCode(user.id, t); // Optional link to activation
    }

    return subscription;
  } catch (err) {
    logError(`createSubscription failed for tenantId: ${tenantId}`, err);
    throw new Error(`Could not create subscription for tenantId: ${tenantId}.`);
  }
};

// Renew expired subscriptions (used by cron or admin triggers)
const renewSubscriptions = async (transaction = null) => {
  const t = transaction || null;
  try {
    // Fetch all expired subscriptions
    const expiredSubs = await models.Subscription.findAll({
      where: { status: 'Expired' },
      transaction: t,
    });

    for (const sub of expiredSubs) {
      const planDetails = PLANS[sub.subscription_plan];
      if (!planDetails) continue;

      const newStartDate = new Date();
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + planDetails.durationMonths);

      // Update subscription with new dates and status
      sub.start_date = newStartDate;
      sub.end_date = newEndDate;
      sub.status = 'Active';
      await sub.save({ transaction: t });

      // Update tenant metadata
      const tenant = await models.Tenant.findByPk(sub.tenant_id, { transaction: t });
      if (tenant) {
        tenant.subscription_start_date = newStartDate;
        tenant.subscription_end_date = newEndDate;
        await tenant.save({ transaction: t });
      }

      console.log(`🔄 Subscription renewed for tenantId ${sub.tenant_id}`);
    }
  } catch (err) {
    logError('renewSubscriptions failed', err);
    throw new Error('Failed to renew subscriptions.');
  }
};

// Get active subscription
const getActiveSubscription = async (tenantId, transaction = null) => {
  const t = transaction || null;
  try {
    const subscription = await models.Subscription.findOne({
      where: {
        tenant_id: tenantId,
        status: 'Active',
      },
      order: [['created_at', 'DESC']],
      transaction: t,
    });

    if (!subscription) throw new Error(`No active subscription found for tenantId: ${tenantId}.`);
    return subscription;
  } catch (err) {
    logError(`getActiveSubscription failed for tenantId: ${tenantId}`, err);
    throw new Error(`Failed to retrieve active subscription for tenantId: ${tenantId}.`);
  }
};

// Get subscription plan details (features and price)
const getSubscriptionPlanDetails = async (tenantId, transaction = null) => {
  const t = transaction || null;
  try {
    const subscription = await getActiveSubscription(tenantId, t);
    return PLANS[subscription.subscription_plan];
  } catch (err) {
    logError(`getSubscriptionPlanDetails failed for tenantId: ${tenantId}`, err);
    throw new Error(`Unable to retrieve plan details for tenantId: ${tenantId}.`);
  }
};

// Get all subscription plans available for future reference
const getAllPlans = () => {
  return PLANS;
};

module.exports = {
  createSubscription,
  renewSubscriptions,
  getActiveSubscription,
  getSubscriptionPlanDetails,
  getAllPlans,
};
