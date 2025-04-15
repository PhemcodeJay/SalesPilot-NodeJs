const Subscription = require('../models/subscription');
const Tenant = require('../models/tenants');

const PLANS = {
  trial: {
    durationMonths: 3,
    features: ['basic_reports'],
    price: 0,
  },
  basic: {
    durationMonths: 12,
    features: ['basic_reports', 'inventory_tracking'],
    price: 100,
  },
  premium: {
    durationMonths: 12,
    features: ['basic_reports', 'inventory_tracking', 'sales_forecasting', 'multi_user_access'],
    price: 300,
  },
};

const createSubscription = async (tenantId, plan = 'trial') => {
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw new Error('Tenant not found');

  const existingSubscription = await Subscription.findOne({
    where: { tenant_id: tenantId },
    order: [['createdAt', 'DESC']],
  });

  if (existingSubscription && new Date(existingSubscription.end_date) > new Date()) {
    throw new Error('Tenant already has an active subscription');
  }

  const planDetails = PLANS[plan];
  if (!planDetails) throw new Error('Invalid subscription plan');

  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(now.getMonth() + planDetails.durationMonths);

  const subscription = await Subscription.create({
    tenant_id: tenant.id,
    subscription_plan: plan,
    start_date: now,
    end_date,
    status: 'Active',
    is_free_trial_used: plan === 'trial' ? 1 : 0,
    features: JSON.stringify(planDetails.features),
    price: planDetails.price,
  });

  return subscription;
};

// 🔄 Auto-renew logic placeholder (to be run via cron or queue)
const renewSubscriptions = async () => {
  const now = new Date();
  const expiredSubscriptions = await Subscription.findAll({
    where: {
      end_date: { [Op.lte]: now },
      status: 'Active',
    },
  });

  for (const sub of expiredSubscriptions) {
    const planDetails = PLANS[sub.subscription_plan];
    const newEndDate = new Date();
    newEndDate.setMonth(newEndDate.getMonth() + planDetails.durationMonths);

    // Extend subscription
    sub.start_date = now;
    sub.end_date = newEndDate;
    sub.status = 'Renewed';
    await sub.save();

    // Optionally notify user via email
    console.log(`🔄 Subscription for tenant ${sub.tenant_id} renewed`);
  }
};

module.exports = {
  createSubscription,
  renewSubscriptions,
};
// Note: This is a simplified example. In a real-world scenario, you would also handle payment processing, error handling, and possibly use a job queue for the renewSubscriptions function.