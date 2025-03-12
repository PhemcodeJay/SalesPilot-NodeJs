const { Subscription } = require('../models');

const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming user is authenticated and added to req
    const tenantId = req.user.tenant_id; // Assuming tenant info is stored in req

    // Fetch active subscription
    const subscription = await Subscription.findOne({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        status: 'active',
      },
    });

    if (!subscription) {
      return res.status(403).json({ message: 'Subscription is inactive or expired. Please renew.' });
    }

    next(); // Allow access if subscription is active
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = checkSubscription;
