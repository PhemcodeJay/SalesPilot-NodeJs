const Tenant = require('../models/tenants');
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

    // Helper function to create new tenant
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
      tenant = await createTenant(); // No ID provided, create new
      tenantId = tenant.id;
    } else {
      tenant = await Tenant.findOne({ where: { id: tenantId } });

      if (!tenant) {
        tenant = await createTenant(tenantId); // Provided ID, but not found
      }
    }

    // Save to session & cookies for future requests
    req.session.tenantId = tenantId;
    res.cookie('tenantId', tenantId, {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    });

    // Attach tenant to request
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
