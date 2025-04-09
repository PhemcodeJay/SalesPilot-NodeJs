const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const Tenant = require('./tenant');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('sales', 'admin', 'manager'),
    defaultValue: 'sales',
    allowNull: false,
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
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'users',
  underscored: true,
});

// Associate User with Tenant
User.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = User;
