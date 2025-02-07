const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Ensure Sequelize instance is properly defined
if (!sequelize) {
  throw new Error('Sequelize instance is undefined. Check your db.js export.');
}

// Define Tenant model
const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tenant name cannot be empty' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email address' },
      notEmpty: { msg: 'Email cannot be empty' },
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[0-9+\-() ]+$/,
        msg: 'Phone number can only contain digits, spaces, "+", "-", and parentheses',
      },
    },
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'inactive',
  },
  subscription_type: {
    type: DataTypes.ENUM('free_trial', 'basic', 'premium', 'enterprise'),
    allowNull: false,
    defaultValue: 'free_trial',
  },
  subscription_start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfter: {
        args: String(new Date()), // Ensures end date is in the future
        msg: 'Subscription end date must be in the future.',
      },
    },
  },
}, {
  timestamps: false,
});

// Import User after defining Tenant
const User = require('./user');



module.exports = Tenant;
