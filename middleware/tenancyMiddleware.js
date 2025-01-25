const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Function to get tenant-specific database configurations
const getTenantDatabase = (tenantDbName) => {
  if (!tenantDbName) {
    throw new Error("tenantDbName must be provided for tenant database configuration.");
  }

  const mysqlPDO = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: tenantDbName,  // Dynamically use the tenant's database
    charset: 'utf8mb4',      // Support extended UTF-8 characters
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const sequelize = new Sequelize(tenantDbName, process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql', // MySQL or MariaDB dialect
    logging: false,   // Disable SQL query logging in console
  });

  return { mysqlPDO, sequelize };
};

// Default Sequelize configuration (for shared, global configurations)
const sequelize = new Sequelize(process.env.DB_NAME || 'salespilot', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: false,
});

// Export both the default sequelize instance and the tenant-specific function
module.exports = {
  sequelize,
  getTenantDatabase,
};
