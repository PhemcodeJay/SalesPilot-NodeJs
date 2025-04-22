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

// Create a new subscription
const createSubscription = async (tenantId, plan = 'trial', transaction = null) => {
  const tenant = await models.Tenant.findByPk(tenantId, { transaction });
  if (!tenant) throw new Error('Tenant not found.');

  const planDetails = PLANS[plan];
  if (!planDetails) throw new Error('Invalid subscription plan.');

  // Check if tenant has already used a free trial
  if (plan === 'trial') {
    const trialUsed = await models.Subscription.findOne({
      where: {
        tenant_id: tenantId,
        is_free_trial_used: true,
      },
      transaction,
    });

    if (trialUsed) {
      throw new Error('Free trial has already been used.');
    }
  }

  // Check if there's an active subscription
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

  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(now.getMonth() + planDetails.durationMonths);

  // Create the subscription record in the database
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

  // Update tenant's subscription start and end dates within the same transaction
  tenant.subscription_start_date = now;
  tenant.subscription_end_date = endDate;
  await tenant.save({ transaction });

  return subscription;
};

// Renew all expired subscriptions
const renewSubscriptions = async () => {
  const now = new Date();

  const expiredSubscriptions = await models.Subscription.findAll({
    where: {
      end_date: { [Op.lte]: now },
      status: 'Active',
    },
  });

  for (const sub of expiredSubscriptions) {
    const planDetails = PLANS[sub.subscription_plan];
    const newEndDate = new Date();
    newEndDate.setMonth(newEndDate.getMonth() + planDetails.durationMonths);

    // Make sure end date is at the end of the month if necessary
    if (newEndDate.getDate() !== now.getDate()) {
      newEndDate.setDate(0);
    }

    sub.end_date = newEndDate;
    sub.status = 'Renewed';
    await sub.save();

    // Also update tenant's subscription dates
    const tenant = await models.Tenant.findByPk(sub.tenant_id);
    if (tenant) {
      tenant.subscription_start_date = now;
      tenant.subscription_end_date = newEndDate;
      await tenant.save();
    }

    console.log(`🔄 Subscription for tenant ${sub.tenant_id} renewed`);
  }
};

// Get the current active subscription for a tenant
const getActiveSubscription = async (tenantId) => {
  const subscription = await models.Subscription.findOne({
    where: {
      tenant_id: tenantId,
      status: 'Active',
    },
    order: [['created_at', 'DESC']],
  });

  return subscription;
};

// Get the subscription plan details for a tenant
const getSubscriptionPlanDetails = async (tenantId) => {
  const subscription = await getActiveSubscription(tenantId);
  if (!subscription) {
    throw new Error('No active subscription found for this tenant');
  }

  return PLANS[subscription.subscription_plan];
};

module.exports = {
  createSubscription,
  renewSubscriptions,
  getActiveSubscription,
  getSubscriptionPlanDetails,
};
