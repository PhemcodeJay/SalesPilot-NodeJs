const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Tenant = require('./tenants');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  username: {
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
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('sales', 'admin', 'manager'),
    allowNull: false,
    defaultValue: 'sales',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  activation_token: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  reset_token: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  reset_token_expiry: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'users',
  underscored: true,
});


module.exports = User;
