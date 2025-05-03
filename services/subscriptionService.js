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
  try {
    const tenant = await models.Tenant.findByPk(tenantId, { transaction });
    if (!tenant) throw new Error('Tenant not found.');

    const planDetails = PLANS[plan];
    if (!planDetails) throw new Error('Invalid subscription plan.');

    // Prevent duplicate free trial
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

    // Check for active subscription
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

    // Create the subscription
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

    // Update tenant meta data
    tenant.subscription_start_date = now;
    tenant.subscription_end_date = endDate;
    await tenant.save({ transaction });

    // Send activation code if it's a new trial and tenant is a user
    if (plan === 'trial') {
      const user = await models.User.findOne({ where: { tenant_id: tenantId }, transaction });
      if (user) await generateActivationCode(user.id); // Optional link to activation
    }

    return subscription;
  } catch (err) {
    logError('createSubscription failed', err);
    throw new Error('Could not create subscription.');
  }
};

// Renew expired subscriptions (used by cron or admin triggers)
const renewSubscriptions = async () => {
  try {
    const expiredSubs = await models.Subscription.findAll({
      where: { status: 'Expired' },
    });

    for (const sub of expiredSubs) {
      const planDetails = PLANS[sub.subscription_plan];
      if (!planDetails) continue;

      const newStartDate = new Date();
      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + planDetails.durationMonths);

      sub.start_date = newStartDate;
      sub.end_date = newEndDate;
      sub.status = 'Active';
      await sub.save();

      const tenant = await models.Tenant.findByPk(sub.tenant_id);
      if (tenant) {
        tenant.subscription_start_date = newStartDate;
        tenant.subscription_end_date = newEndDate;
        await tenant.save();
      }

      console.log(`🔄 Subscription renewed for tenant ${sub.tenant_id}`);
    }
  } catch (err) {
    logError('renewSubscriptions failed', err);
  }
};

// Get active subscription
const getActiveSubscription = async (tenantId) => {
  try {
    const subscription = await models.Subscription.findOne({
      where: {
        tenant_id: tenantId,
        status: 'Active',
      },
      order: [['created_at', 'DESC']],
    });

    if (!subscription) throw new Error('No active subscription found for this tenant.');
    return subscription;
  } catch (err) {
    logError('getActiveSubscription failed', err);
    throw err;
  }
};

// Get subscription plan details
const getSubscriptionPlanDetails = async (tenantId) => {
  try {
    const subscription = await getActiveSubscription(tenantId);
    return PLANS[subscription.subscription_plan];
  } catch (err) {
    logError('getSubscriptionPlanDetails failed', err);
    throw new Error('Unable to retrieve plan details.');
  }
};

module.exports = {
  createSubscription,
  renewSubscriptions,
  getActiveSubscription,
  getSubscriptionPlanDetails,
};
