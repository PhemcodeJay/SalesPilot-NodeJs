const Subscription = require('../models/subscription');
const Tenant = require('../models/tenants');

const createSubscription = async (tenantId, plan = 'trial') => {
  const tenant = await Tenant.findByPk(tenantId);
  
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Check if the tenant already has a subscription
  const existingSubscription = await Subscription.findOne({ where: { tenant_id: tenantId } });

  if (existingSubscription) {
    throw new Error('Tenant already has an active subscription');
  }

  const subscription = await Subscription.create({
    tenant_id: tenant.id,
    subscription_plan: plan,
    start_date: new Date(),
    end_date: plan === 'trial' ? new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Set 3 months for trial
    status: 'Active',
    is_free_trial_used: plan === 'trial' ? 1 : 0,
  });

  return subscription;
};

module.exports = { createSubscription };
