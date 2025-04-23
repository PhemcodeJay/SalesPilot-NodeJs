const path = require('path');
const { Tenant, User, Subscription, ActivationCode } = require('../models'); // Main DB models
const { getTenantDb } = require('../config/db'); // Utility for tenant DB instance
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Middleware to resolve and attach the correct Sequelize instance for the tenant
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // ✅ Bypass tenant check for public or auth routes (signup and login)
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

      // Create a new tenant if not found (only for dev/testing, optional for production)
      tenant = await Tenant.create({
        id: tenantId,
        name: 'Default Tenant', // Replace with dynamic tenant name logic (e.g., from request body)
        email: `default-${tenantId}@example.com`, // Replace with dynamic email
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

    // Now that the tenant exists, proceed to create a user, activation code, and subscription if it's a signup request
    if (req.path === '/signup' && req.body) {
      const { username, email, password, role, phone, location } = req.body;

      // Ensure password is hashed before saving (via service or bcrypt middleware)
      const user = await User.create({
        tenant_id: tenantId,
        username,
        email,
        password,  // Make sure password is hashed elsewhere in your user model or service
        role: role || 'sales',  // Default to 'sales' if no role provided
        phone,
        location,
      });

      console.log(`✅ Created user: ${user.username}`);

      // Create the activation code for the user
      const activationCode = crypto.randomBytes(20).toString('hex'); // Random activation code
      await ActivationCode.create({
        user_id: user.id,
        activation_code: activationCode,
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiration
      });

      console.log(`✅ Created activation code for user: ${user.username}`);

      // Create the subscription for the user
      const subscription = await Subscription.create({
        tenant_id: tenantId,
        user_id: user.id,
        subscription_plan: 'trial',  // Default to trial subscription
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days trial
        status: 'Active',
        is_free_trial_used: false,  // Optional flag for trial status
      });

      console.log(`✅ Created subscription for user: ${user.username}`);

      // Insert data into main database as well
      await User.create({
        tenant_id: tenantId,
        username,
        email,
        password,  // Same hashed password
        role: role || 'sales',  // Default to 'sales'
        phone,
        location,
      });

      console.log(`✅ Inserted user into main database: ${user.username}`);

      // Insert activation code into main database
      await ActivationCode.create({
        user_id: user.id,
        activation_code: activationCode,
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiration
      });

      console.log(`✅ Inserted activation code into main database for user: ${user.username}`);

      // Insert subscription into main database
      await Subscription.create({
        tenant_id: tenantId,
        user_id: user.id,
        subscription_plan: 'trial',
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days trial
        status: 'Active',
        is_free_trial_used: false,
      });

      console.log(`✅ Inserted subscription into main database for user: ${user.username}`);

      // Attach the created user and subscription to the request for further use (e.g., login, etc.)
      req.user = user;  // Make user available for next middleware or routes
      req.subscription = subscription;  // Make subscription available for next middleware or routes
    }

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
