const { models } = require('../models');
const Tenant = models.Tenant;
const User = models.User; // Assuming you have a User model
const Subscription = models.Subscription; // Assuming you have a Subscription model

const { v4: uuidv4 } = require('uuid');

const tenantMiddleware = async (req, res, next) => {
  let tenantId =
    req.headers['x-tenant-id'] ||
    req.body.tenantId ||
    req.query.tenantId ||
    req.cookies?.tenantId ||
    req.session?.tenantId;

  try {
    let tenant = null;

    // Helper function to create a new tenant
    const createTenant = async (customId = null) => {
      const now = new Date();
      const end = new Date();
      end.setMonth(now.getMonth() + 3); // 3-month trial

      const id = customId || uuidv4();

      const newTenant = await Tenant.create({
        id,
        name: `Tenant-${id.slice(0, 6)}`,
        email: `auto-${id}@salespilot.app`,
        subscription_start_date: now,
        subscription_end_date: end
      });

      req.newTenantCreated = true;
      return newTenant;
    };

    // Try to find existing tenant or create a new one
    if (!tenantId) {
      tenant = await createTenant(); // No ID provided, create new tenant
      tenantId = tenant.id;
    } else {
      tenant = await Tenant.findOne({ where: { id: tenantId } });

      if (!tenant) {
        tenant = await createTenant(tenantId); // Provided ID, but tenant not found
      }
    }

    // Check if the tenant already has a user and/or subscription
    const existingUser = await User.findOne({ where: { tenantId: tenant.id } });
    if (existingUser) {
      return res.status(400).json({ error: 'This tenant already has a user associated.' });
    }

    const existingSubscription = await Subscription.findOne({ where: { tenantId: tenant.id } });
    if (existingSubscription) {
      return res.status(400).json({ error: 'This tenant already has an active subscription.' });
    }

    // Save tenantId to session & cookies for future requests
    req.session.tenantId = tenantId;
    res.cookie('tenantId', tenantId, {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    });

    // Attach tenant to the request
    req.tenant = tenant;
    req.tenantId = tenantId;

    next();
  } catch (err) {
    console.error('Tenant middleware error:', err);

    if (res.render) {
      return res.status(500).render('error', {
        message: 'An error occurred while processing tenant information.',
        error: err
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = tenantMiddleware;
