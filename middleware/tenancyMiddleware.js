const { sequelize } = require('../config/db');  // Import Sequelize configuration

// Tenant middleware to identify and set the tenant's database configuration
const tenancyMiddleware = async (req, res, next) => {
  try {
    const host = req.headers.host.split(':')[0]; // Get the subdomain (tenant) from the host
    const tenantDomain = host.split('.')[0]; // Assume tenant is the subdomain e.g. tenant1 in tenant1.yourapp.com

    if (!tenantDomain) {
      return res.status(400).json({ message: 'Tenant domain not found' });
    }

    // Check if the tenant exists in the database (you can query a "tenants" table)
    const tenant = await sequelize.query('SELECT * FROM tenants WHERE domain = ?', {
      replacements: [tenantDomain],
      type: sequelize.QueryTypes.SELECT,
    });

    // If no tenant is found, handle the empty DB scenario smoothly
    if (!tenant || tenant.length === 0) {
      console.warn(`Tenant ${tenantDomain} not found in the database.`);

      // Optionally, create a new tenant (you can add extra checks like unique domain)
      await sequelize.query('INSERT INTO tenants (domain, db_name) VALUES (?, ?)', {
        replacements: [tenantDomain, `${tenantDomain}_db`],
        type: sequelize.QueryTypes.INSERT,
      });

      // Notify that a new tenant entry has been created (this can be adjusted to your needs)
      return res.status(404).json({
        message: `Tenant not found. A new tenant entry has been created with the domain ${tenantDomain}.`
      });
    }

    // If tenant found, attach the tenant information to the request object
    req.tenant = tenant[0]; // Attach the tenant info to the request object

    console.log(`Tenant identified: ${tenantDomain} - Database: ${tenant[0].db_name}`);

    // Continue with the next middleware or route handler
    next();
  } catch (err) {
    console.error('Error in tenancy middleware:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = tenancyMiddleware;
