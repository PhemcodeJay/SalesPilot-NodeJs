const { getTenantDatabase } = require('../config/db');  // Import the database function

module.exports = (req, res, next) => {
  // Attempt to get tenant identifier from request (either from headers or subdomains)
  const tenantId = req.headers['tenant-id'] || req.subdomains[0];  // Modify this based on your system

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant ID is required.' });
  }

  // Assuming your tenant databases are named in the format 'tenant_db_{tenantId}'
  const tenantDbName = `tenant_db_${tenantId}`;  // Customize this naming convention if necessary

  try {
    // Get the tenant's database configurations
    const { sequelize, mysqlPDO } = getTenantDatabase(tenantDbName);

    // Attach the sequelize instance to the request object
    req.sequelize = sequelize;
    req.mysqlPDO = mysqlPDO;

    // Log the tenant info for debugging (optional)
    console.log(`Tenant database for ${tenantId}: ${tenantDbName}`);

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error fetching tenant database configuration:', error);
    return res.status(500).json({ message: 'Tenant database configuration error' });
  }
};
