// middleware/tenancyMiddleware.js

const { getTenantDatabase, createTenantDatabase } = require('../config/db');  // Ensure proper import

module.exports = async (req, res, next) => {
  // Attempt to get tenant identifier from request (either from headers or subdomains)
  let tenantId = req.headers['tenant-id'] || req.subdomains[0];  // Modify this based on your system

  if (!tenantId) {
    // If no tenant ID exists, generate a new tenant ID
    tenantId = `tenant_${Date.now()}`;  // Example: Generates a unique tenant ID using the current timestamp
    console.log(`Generated new tenant ID: ${tenantId}`);
    
    try {
      // Create the new tenant's database (this might vary depending on your actual database creation logic)
      const newTenantDbName = `tenant_db_${tenantId}`; // Customize the naming convention as necessary
      await createTenantDatabase(newTenantDbName);
      console.log(`New tenant database created: ${newTenantDbName}`);
    } catch (error) {
      console.error('Error creating new tenant database:', error);
      return res.status(500).json({ message: 'Error creating new tenant database' });
    }
  }

  // Now that we have the tenantId (whether from the request or newly created), we get its database configurations
  const tenantDbName = `tenant_db_${tenantId}`;  // Customize this naming convention if necessary

  try {
    // Get the tenant's database configurations
    const { sequelize, mysqlPDO } = getTenantDatabase(tenantDbName);

    // Attach the sequelize instance to the request object
    req.sequelize = sequelize;
    req.mysqlPDO = mysqlPDO;
    req.tenantId = tenantId;  // Attach tenantId to the request for further use

    // Log the tenant info for debugging (optional)
    console.log(`Tenant database for ${tenantId}: ${tenantDbName}`);

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error fetching tenant database configuration:', error);
    return res.status(500).json({ message: 'Tenant database configuration error' });
  }
};
