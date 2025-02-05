const { getTenantDatabase } = require('../config/db');
const { v4: uuidv4 } = require('uuid'); // Import UUID for fallback Tenant ID

module.exports = async (req, res, next) => {
  const publicRoutes = ['/login', '/signup', '/index']; // Define public routes

  console.log(`Incoming request: ${req.path}`);
  console.log('Request Headers:', req.headers);

  // If it's a public route, bypass tenant logic
  if (publicRoutes.includes(req.path)) {
    console.log(`Public route accessed: ${req.path}, skipping tenant check.`);
    return next();
  }

  // Extract Tenant ID from headers
  let tenantId = req.headers['tenant-id'];

  // Generate a UUID-based Tenant ID if missing
  if (!tenantId) {
    console.warn('Tenant ID missing, generating new Tenant ID.');
    tenantId = `tenant_${uuidv4().slice(0, 8)}`;
  }

  try {
    const tenantDbName = `tenant_db_${tenantId}`;
    console.log(`Fetching tenant database: ${tenantDbName}`);

    const { sequelize, mysqlPDO } = getTenantDatabase(tenantDbName);

    req.sequelize = sequelize;
    req.mysqlPDO = mysqlPDO;
    req.tenantId = tenantId;

    console.log(`Tenant database initialized for: ${tenantId}`);
    next();
  } catch (error) {
    console.error('Error setting up tenant database:', error.message);
    return res.status(500).json({ message: 'Error initializing tenant database.' });
  }
};
