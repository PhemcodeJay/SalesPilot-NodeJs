const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user'); // Ensure this is required if you add the association here

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    allowNull: false,
    validate: {
      isUUID: 4,
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
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
    type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
    defaultValue: 'trial',
    allowNull: false,
  },
  subscription_start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'tenants',
  underscored: true,
});



module.exports = Tenant;
