const { models } = require('../config/db');
const { Op } = require('sequelize');

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

// Create a new subscription for a tenant
const createSubscription = async (tenantId, plan = 'trial', transaction = null) => {
  const tenant = await models.Tenant.findByPk(tenantId, { transaction });
  if (!tenant) throw new Error('Tenant not found.');

  const planDetails = PLANS[plan];
  if (!planDetails) throw new Error('Invalid subscription plan.');

  // Handle trial plan and ensure free trial usage
  if (plan === 'trial') {
    const trialUsed = await models.Subscription.findOne({
      where: {
        tenant_id: tenantId,
        is_free_trial_used: true,
      },
      transaction,
    });
    if (trialUsed) throw new Error('Free trial has already been used.');
  }

  // Check if the tenant already has an active subscription
  const existingSubscription = await models.Subscription.findOne({
    where: {
      tenant_id: tenantId,
      status: 'Active',
    },
    order: [['created_at', 'DESC']],
    transaction,
  });

  if (existingSubscription && new Date(existingSubscription.end_date) > new Date()) {
    throw new Error('Tenant already has an active subscription.');
  }

  // Calculate the subscription start and end dates
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(now.getMonth() + planDetails.durationMonths);

  // Create the subscription record
  const subscription = await models.Subscription.create({
    tenant_id: tenant.id,
    subscription_plan: plan,
    start_date: now,
    end_date: endDate,
    status: 'Active',
    is_free_trial_used: plan === 'trial',
    features: JSON.stringify(planDetails.features),
    price: planDetails.price,
  }, { transaction });

  // Update the tenant's subscription information
  tenant.subscription_start_date = now;
  tenant.subscription_end_date = endDate;
  await tenant.save({ transaction });

  return subscription;
};

// Renew expired subscriptions
const renewSubscriptions = async () => {
  const now = new Date();

  // Find subscriptions marked as 'Expired' (from cron job)
  const expiredSubscriptions = await models.Subscription.findAll({
    where: {
      status: 'Expired',
    },
  });

  for (const sub of expiredSubscriptions) {
    const planDetails = PLANS[sub.subscription_plan];
    if (!planDetails) continue; // Skip if plan no longer exists

    const newStartDate = new Date();
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + planDetails.durationMonths);

    // Update subscription record
    sub.start_date = newStartDate;
    sub.end_date = newEndDate;
    sub.status = 'Active';
    await sub.save();

    // Update tenant's subscription info
    const tenant = await models.Tenant.findByPk(sub.tenant_id);
    if (tenant) {
      tenant.subscription_start_date = newStartDate;
      tenant.subscription_end_date = newEndDate;
      await tenant.save();
    }

    console.log(`🔄 Subscription for tenant ${sub.tenant_id} renewed`);
  }
};

// Get the active subscription for a tenant
const getActiveSubscription = async (tenantId) => {
  const subscription = await models.Subscription.findOne({
    where: {
      tenant_id: tenantId,
      status: 'Active',
    },
    order: [['created_at', 'DESC']],
  });

  if (!subscription) throw new Error('No active subscription found for this tenant');

  return subscription;
};

// Get detailed plan info for a tenant’s current active subscription
const getSubscriptionPlanDetails = async (tenantId) => {
  try {
    const subscription = await getActiveSubscription(tenantId);
    if (!subscription) throw new Error('No active subscription found for this tenant');

    return PLANS[subscription.subscription_plan];
  } catch (err) {
    throw new Error(`Failed to get subscription plan details: ${err.message}`);
  }
};

module.exports = {
  createSubscription,
  renewSubscriptions,
  getActiveSubscription,
  getSubscriptionPlanDetails,
};
