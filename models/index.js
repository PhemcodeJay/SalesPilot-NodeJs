const { getTenantDatabase } = require('../config/db'); // Import dynamic DB function
const { DataTypes } = require('sequelize');

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
    const sequelize = await getTenantDatabase(tenantDbName); // Get dynamic Sequelize instance

    // ✅ Initialize models dynamically for the tenant
    Tenant.init(sequelize, DataTypes);
    User.init(sequelize, DataTypes);
    Subscription.init(sequelize, DataTypes);
    Product.init(sequelize, DataTypes);
    Category.init(sequelize, DataTypes);
    Sale.init(sequelize, DataTypes);
    Customer.init(sequelize, DataTypes);
    Supplier.init(sequelize, DataTypes);
    Invoice.init(sequelize, DataTypes);
    Payment.init(sequelize, DataTypes);
    PasswordResetToken.init(sequelize, DataTypes);

    // ✅ Define associations (if any)
    Object.values(sequelize.models).forEach((model) => {
      if (typeof model.associate === 'function') {
        model.associate(sequelize.models);
      }
    });

    console.log(`✅ Models initialized for tenant: ${tenantDbName}`);

    return {
      sequelize,
      Tenant,
      User,
      Subscription,
      Product,
      Category,
      Sale,
      Customer,
      Supplier,
      Invoice,
      Payment,
      PasswordResetToken,
    };
  } catch (error) {
    console.error(`❌ Error initializing models for tenant ${tenantDbName}:`, error.message);
    throw error;
  }
}

// Export the function to be used where needed
module.exports = initializeTenantModels;
