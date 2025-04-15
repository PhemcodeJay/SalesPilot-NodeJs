const { models } = require('../config/db');  // Import models from db.js
const { Op } = require('sequelize'); // Import Sequelize operator for querying

// Subscription Plans Definition
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

// Function to Create Subscription for a Tenant
const createSubscription = async (tenantId, plan = 'trial') => {
  const tenant = await models.Tenant.findByPk(tenantId);
  if (!tenant) throw new Error('Tenant not found.');

  const planDetails = PLANS[plan];
  if (!planDetails) throw new Error('Invalid subscription plan.');

  // Check if there's an active subscription for the tenant
  const existingSubscription = await models.Subscription.findOne({
    where: { tenant_id: tenantId, status: 'Active' },
    order: [['createdAt', 'DESC']],
  });

  if (existingSubscription && new Date(existingSubscription.end_date) > new Date()) {
    throw new Error('Tenant already has an active subscription.');
  }

  // Set the subscription end date
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
    is_free_trial_used: plan === 'trial' ? 1 : 0,
    features: JSON.stringify(planDetails.features),
    price: planDetails.price,
  });

  return subscription;
};

// Function to Renew Expired Subscriptions (scheduled via cron job or queue)
const renewSubscriptions = async () => {
  const now = new Date();
  
  // Find all expired active subscriptions
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

    // Extend subscription end date and mark it as renewed
    sub.end_date = newEndDate;
    sub.status = 'Renewed';
    await sub.save();

    console.log(`🔄 Subscription for tenant ${sub.tenant_id} renewed`);
  }
};

module.exports = {
  createSubscription,
  renewSubscriptions,
};
