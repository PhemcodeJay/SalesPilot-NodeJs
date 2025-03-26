const { DataTypes } = require('sequelize');
const { getTenantDatabase } = require('../config/db.js');

// Import Models
const Tenant = require('./Tenant');
const User = require('./User');
const Subscription = require('./subscriptions');
const Product = require('./product');
const Category = require('./category');
const Sale = require('./sales');
const Customer = require('./customer');
const Supplier = require('./supplier');
const Invoice = require('./invoice');
const Payment = require('./payment');
const PasswordResetToken = require('./passwordreset');

/**
 * Function to initialize models dynamically for a tenant
 * @param {string} tenantDbName - The tenant's database name
 * @returns {Promise<object>} - Object containing initialized models
 */
async function initializeTenantModels(tenantDbName) {
  try {
    // ✅ Get Sequelize instance for the tenant
    const { sequelize } = await getTenantDatabase(tenantDbName);

    // ✅ Initialize models dynamically for the tenant
    const models = {
      Tenant: Tenant.init(sequelize, DataTypes),
      User: User.init(sequelize, DataTypes),
      Subscription: Subscription.init(sequelize, DataTypes),
      Product: Product.init(sequelize, DataTypes),
      Category: Category.init(sequelize, DataTypes),
      Sale: Sale.init(sequelize, DataTypes),
      Customer: Customer.init(sequelize, DataTypes),
      Supplier: Supplier.init(sequelize, DataTypes),
      Invoice: Invoice.init(sequelize, DataTypes),
      Payment: Payment.init(sequelize, DataTypes),
      PasswordResetToken: PasswordResetToken.init(sequelize, DataTypes),
    };

    // ✅ Define model associations
    Object.values(models).forEach((model) => {
      if (typeof model.associate === 'function') {
        model.associate(models);
      }
    });

    console.log(`✅ Models initialized for tenant: ${tenantDbName}`);

    return { sequelize, ...models };
  } catch (error) {
    console.error(`❌ Error initializing models for tenant ${tenantDbName}:`, error.message);
    throw error;
  }
}

// ✅ Export the function for use in other files
module.exports = initializeTenantModels;
