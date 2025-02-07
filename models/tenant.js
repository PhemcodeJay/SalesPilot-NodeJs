const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Assuming you have a configured sequelize instance

// Tenant Model
const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4, // Automatically generate a UUID
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tenant name cannot be empty',
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please enter a valid email address',
      },
      notEmpty: {
        msg: 'Email cannot be empty',
      },
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{10}$/, // Assuming phone number is in a valid format (10 digits)
      msg: 'Phone number must be 10 digits',
    },
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM,
    values: ['active', 'inactive'],
    defaultValue: 'inactive',
  },
  subscription_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'free_trial', // Default to free trial subscription
  },
  subscription_start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW, // Default to current time
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
});

// Relationship: A tenant can have multiple users (for example, admins, members)
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = Tenant;
