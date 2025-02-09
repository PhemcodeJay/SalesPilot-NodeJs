const { sequelize } = require('../config/db');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize models using `new`
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



// ✅ Export Models
const models = {
  Tenant,
  User,
  Product,
  Category,
  Sale,
  Customer,
  Invoice,
  Subscription,
  Payment,
  Supplier,
  PasswordResetToken,
};



// Export Sequelize instance & models
module.exports = { ...models, sequelize };