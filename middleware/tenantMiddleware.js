const Tenant = require('../models/tenants');
const { v4: uuidv4 } = require('uuid');

const tenantMiddleware = async (req, res, next) => {
  let tenantId =
    req.headers['x-tenant-id'] ||
    req.body.tenantId ||
    req.query.tenantId ||
    req.cookies?.tenantId || // Check if cookie exists
    req.session?.tenantId;   // Or from session

  try {
    let tenant;

    // If tenantId is not provided, create a new tenant
    if (!tenantId) {
      tenantId = uuidv4();
      tenant = await Tenant.create({
        id: tenantId,
        name: `Tenant-${tenantId.slice(0, 6)}`
      });
      req.newTenantCreated = true;
    } else {
      // Try to find the tenant
      tenant = await Tenant.findOne({ where: { id: tenantId } });

      // If not found, create it
      if (!tenant) {
        tenant = await Tenant.create({
          id: tenantId,
          name: `Tenant-${tenantId.slice(0, 6)}`
        });
        req.newTenantCreated = true;
      }
    }

    // Store tenant ID in session and cookie
    req.session.tenantId = tenantId;
    res.cookie('tenantId', tenantId, {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    });

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
