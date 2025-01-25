// middleware/tenancyMiddleware.js

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

    if (!tenant || tenant.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Dynamically set the tenant's database connection if needed
    req.tenant = tenant[0]; // Attach the tenant info to the request object

    // You can also dynamically configure a Sequelize instance here
    // or change the database connection based on the tenant if needed
    console.log(`Tenant identified: ${tenantDomain} - Database: ${tenant[0].db_name}`);
    
    next();
  } catch (err) {
    console.error('Error in tenancy middleware:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = tenancyMiddleware;
