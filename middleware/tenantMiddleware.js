const path = require('path');
const { Tenant } = require('../models'); // Main DB models
const { getTenantDb } = require('../config/db'); // Utility for tenant DB instance
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to resolve and attach the correct Sequelize instance for the tenant
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // ✅ Bypass tenant check for public or auth routes
    const skipRoutes = ['/', '/signup', '/login'];
    if (skipRoutes.includes(req.path) || req.path.startsWith('/public') || path.extname(req.path)) {
      return next();
    }

    // 🔍 Extract tenant ID from various possible locations
    let tenantId =
      req.user?.tenant_id ||           // from authenticated user
      req.headers['x-tenant-id'] ||    // custom header
      req.query.tenant_id ||           // query string
      req.body?.tenant_id;             // post body

    console.log('🔎 Tenant ID Found:', tenantId);

    // ✅ Fallback to generating tenant ID if none provided (for dev/demo use only)
    if (!tenantId) {
      console.warn('⚠️ No tenant_id provided. Generating one (for dev/demo use only).');
      tenantId = uuidv4();
    }

    // ✅ Validate and retrieve tenant from the main database
    let tenant = await Tenant.findOne({ where: { id: tenantId } });
    if (!tenant) {
      console.warn(`❌ Tenant with ID "${tenantId}" not found.`);

      // Optional: Create a new default tenant (only for dev or testing)
      tenant = await Tenant.create({
        id: tenantId,
        name: 'Default Tenant',
        email: `default-${tenantId}@example.com`,
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days trial
      });

      console.log(`✅ Created new tenant with ID: ${tenantId}`);
    }

    // ✅ Attach tenant DB connection to request
    const tenantDb = await getTenantDb(tenantId);
    req.tenantId = tenantId;
    req.tenantDb = tenantDb;

    // ✅ Make tenantId available in all views (if using EJS, can be accessed here)
    res.locals.tenantId = tenantId;

    // ✅ Proceed to the next middleware/route
    next();
  } catch (err) {
    console.error('💥 Tenant Middleware Error:', err.message);
    
    // Handle errors and display error message to the user
    res.status(500).render('error', {
      title: 'Tenant Error',
      statusCode: 500,
      message: 'An error occurred while resolving the tenant.',
    });
  }
};

module.exports = tenantMiddleware;
