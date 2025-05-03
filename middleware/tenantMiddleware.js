const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const { Tenant, User, Subscription, ActivationCode } = require('../models'); // Main DB models
const { getTenantDb } = require('../config/db'); // Per-tenant Sequelize instance
const { sendActivationEmail } = require('../utils/emailUtils');

// Routes that don't require tenant resolution
const skipTenantValidationRoutes = ['/', '/signup', '/login', '/recoverpwd'];

const tenantMiddleware = async (req, res, next) => {
  try {
    // 🛑 Skip tenant validation for public/auth/static routes
    const isStatic = !!path.extname(req.path);
    const shouldSkip = skipTenantValidationRoutes.includes(req.path) || req.path.startsWith('/public') || isStatic;

    if (shouldSkip) return next();

    // 🔍 Try to extract tenant_id from available sources
    let tenantId =
      req.user?.tenant_id ||
      req.headers['x-tenant-id'] ||
      req.query.tenant_id ||
      req.body?.tenant_id;

    console.log('🔎 Tenant ID Found:', tenantId);

    // ⚠️ Dev/demo fallback: generate tenant_id if missing
    if (!tenantId) {
      console.warn('⚠️ No tenant_id provided. Generating one (for dev/demo only).');
      tenantId = uuidv4();
    }

    // 🔍 Check main DB for tenant
    let tenant = await Tenant.findOne({ where: { id: tenantId } });

    // 🆕 Create new tenant if not found (dev/demo only)
    if (!tenant) {
      console.warn(`❌ Tenant "${tenantId}" not found. Creating new one.`);

      // 🏢 Create tenant first
      tenant = await Tenant.create({
        id: tenantId,
        name: `Default Tenant`, // You can replace this with dynamic data from the signup process
        email: `default-${tenantId}@example.com`, // Default email or from the signup
        user_id: null, // user_id will be set later
        subscription_start_date: new Date(),
        subscription_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90-day trial
      });

      console.log(`✅ Created tenant: ${tenant.id}`);

      // 👤 Now create user and link it to the created tenant
      const { username, email, password } = req.body; // User signup info
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        tenant_id: tenant.id, // Link user to the created tenant
        username: username || `default-user-${tenantId}`,
        email: email || `default-${tenantId}@example.com`,
        password: hashedPassword,
        role: 'admin', // Default role for dev/demo users
        status: 'inactive', // Default inactive status for demo
      });

      console.log(`✅ Created user: ${user.username} for tenant ${tenantId}`);

      // Link the user back to the tenant (set user_id in the tenant table)
      tenant.user_id = user.id;
      await tenant.save(); // Update tenant with correct user_id

      // 🏢 Create the subscription for the tenant's user
      await Subscription.create({
        tenant_id: tenant.id,
        user_id: user.id,
        subscription_plan: 'trial',
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90-day trial
        status: 'Active',
        is_free_trial_used: false,
      });

      console.log(`✅ Created subscription for tenant ${tenantId}`);

      // Optionally send activation email for non-dev users
      if (!email.startsWith('default-')) {
        const activationCode = crypto.randomBytes(20).toString('hex');
        await ActivationCode.create({
          user_id: user.id,
          activation_code: activationCode,
          expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1-day expiration
        });
        await sendActivationEmail(user.email, activationCode);
      }
    }

    // ✅ Attach tenant DB connection to request
    const tenantDb = await getTenantDb(tenantId);
    req.tenantId = tenantId;
    req.tenantDb = tenantDb;
    res.locals.tenantId = tenantId;

    // ✅ Proceed
    return next();

  } catch (err) {
    console.error('💥 Tenant Middleware Error:', err);
    return res.status(500).render('error', {
      title: 'Tenant Error',
      statusCode: 500,
      message: 'An error occurred while resolving the tenant.',
    });
  }
};

module.exports = tenantMiddleware;
