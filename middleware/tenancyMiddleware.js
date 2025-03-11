const { getTenantDatabase } = require('../config/db');

module.exports = async (req, res, next) => {
  const publicRoutes = ['/login', '/signup', '/index']; // Define public routes

  // If it's a public route, bypass tenant logic
  if (publicRoutes.includes(req.path)) {
    console.log(`[INFO] Public route accessed: ${req.path}, skipping tenant check.`);
    return next();
  }

  // Extract Tenant ID from headers
  const tenantId = req.headers['tenant-id'];

  if (!tenantId) {
    console.error('[ERROR] Tenant ID is missing in request headers.');
    return res.status(400).json({ message: 'Tenant ID is required.' });
  }

  try {
    console.log(`[INFO] Fetching tenant database for Tenant ID: ${tenantId}`);

    const sequelize = getTenantDatabase(tenantId); // Fix: Use function correctly

    if (!sequelize) {
      throw new Error(`Could not initialize tenant database for ${tenantId}`);
    }

    req.sequelize = sequelize;
    req.tenantId = tenantId;

    console.log(`[SUCCESS] Tenant database initialized for: ${tenantId}`);
    next();
  } catch (error) {
    console.error(`[ERROR] Error setting up tenant database: ${error.message}`);
    return res.status(500).json({ message: 'Error initializing tenant database.' });
  }
};
