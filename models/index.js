const { sequelize } = require('../config/db');

// Import all models
const User = require('./user');
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
const Tenant = require('./tenant');
const ActivationCode = require('./activation-code');
const PasswordResetToken = require('./passwordreset');

const models = {
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
  Tenant,
  ActivationCode,
  PasswordResetToken,
};


async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({ alter: true }); // Ensures tables are created/updated
    console.log('All models synchronized.');
  } catch (error) {
    console.error('Database initialization error:', error.message);
    process.exit(1);
  }
}

// Initialize the database
initializeDatabase();

module.exports = { ...models, sequelize };
