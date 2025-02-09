const { sequelize } = require('../config/db');

// Import Models (Ensure Correct Case)
const Tenant = require('./tenant');  
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
const Subscription = require('./subscriptions'); // Ensure correct filename
const Payment = require('./payment');
const Supplier = require('./supplier');
const ActivationCode = require('./activation-code');
const PasswordResetToken = require('./passwordreset');

// 🚀 Define Relationships (Associations)
// ✅ Tenant & User
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users', onDelete: 'CASCADE' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// ✅ User & Subscription
User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions', onDelete: 'CASCADE' });
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ✅ Tenant & Subscription
Tenant.hasMany(Subscription, { foreignKey: 'tenant_id', as: 'subscriptions', onDelete: 'CASCADE' });
Subscription.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// ✅ User & Sales
User.hasMany(Sale, { foreignKey: 'user_id', as: 'sales', onDelete: 'CASCADE' });
Sale.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ✅ Product & Category
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ✅ Sale & Product
Product.hasMany(Sale, { foreignKey: 'product_id', as: 'sales' });
Sale.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ✅ Sale & Customer
Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// ✅ Supplier & Product
Supplier.hasMany(Product, { foreignKey: 'supplier_id', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// ✅ Invoice & Customer
Customer.hasMany(Invoice, { foreignKey: 'customer_id', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// ✅ Invoice & Payment
Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

// ✅ User & Password Reset Tokens
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'resetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 📌 Export All Models
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

// 🔥 Function to Initialize Database
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

// 🚀 Initialize Database
initializeDatabase();

// 📤 Export Models & Sequelize Instance
module.exports = { ...models, sequelize };
