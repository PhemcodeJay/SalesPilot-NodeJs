const { sequelize } = require('../config/db');

const { Sequelize, DataTypes } = require('sequelize');
const Tenant = new (require('./Tenant'))(sequelize, DataTypes);
const User = new (require('./User'))(sequelize, DataTypes);
const Subscription = new (require('./subscriptions'))(sequelize, DataTypes);
const Product = new (require('./product'))(sequelize, DataTypes);
const Category = new (require('./category'))(sequelize, DataTypes);
const Sale = new (require('./sales'))(sequelize, DataTypes);
const Customer = new (require('./customer'))(sequelize, DataTypes);
const Supplier = new (require('./supplier'))(sequelize, DataTypes);
const Invoice = new (require('./invoice'))(sequelize, DataTypes);
const Payment = new (require('./payment'))(sequelize, DataTypes);
const PasswordResetToken = new (require('./passwordreset'))(sequelize, DataTypes);

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

//✅ User & Product
User.hasMany(Product, { foreignKey: 'user_id', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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

// ✅ Payment & Subscription
Payment.hasMany(Subscription, { foreignKey: 'payment_id', as: 'subscriptions' });
Subscription.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

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
