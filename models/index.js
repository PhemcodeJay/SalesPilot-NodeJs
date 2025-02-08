const { sequelize } = require('../config/db');

// Import Models (In Correct Order)
const Tenant = require('./tenant');  // Import Tenant first
const User = require('./user');      // Import User after Tenant

// Define Relationships (After Importing All Models)
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Import Remaining Models
const Product = require('./product');
const Category = require('./category');
const Sale = require('./sales');
const SalesAnalytics = require('./analytics');
const Inventory = require('./inventory');
const Report = require('./report');
const Customer = require('./customer');
const Expense = require('./expense');
const Invoice = require('./invoice');
const Subscription = require('./subscriptions');
const Payment = require('./payment');
const Supplier = require('./supplier');
const ActivationCode = require('./activation-code');
const PasswordResetToken = require('./passwordreset');

// Object to Export All Models
const models = {
  Tenant,
  User,
  Product,
  Category,
  Sale,
  SalesAnalytics,
  Inventory,
  Report,
  Customer,
  Expense,
  Invoice,
  Subscription,
  Payment,
  Supplier,
  ActivationCode,
  PasswordResetToken,
};

// Function to Initialize Database
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    await sequelize.sync({ alter: true }); // Sync models
    console.log('✅ Models synchronized.');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
  }
}

// Initialize Database
initializeDatabase();

// Export Models & Sequelize Instance
module.exports = { ...models, sequelize };
