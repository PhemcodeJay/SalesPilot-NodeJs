const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Using the main Sequelize connection

class Tenant extends Model {
  static associate(models) {
    // ✅ Define associations inside this method
    Tenant.hasMany(models.User, { foreignKey: 'tenant_id', as: 'users', onDelete: 'CASCADE' });
    Tenant.hasMany(models.Subscription, { foreignKey: 'tenant_id', as: 'subscriptions', onDelete: 'CASCADE' });
  }
}

Tenant.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Tenant name cannot be empty' } },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: { msg: 'Please enter a valid email address' } },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { is: /^[0-9+\-() ]+$/ },
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
      type: DataTypes.ENUM('trial', 'basic', 'premium', 'enterprise'),
      allowNull: false,
      defaultValue: 'trial',
    },
    subscription_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    subscription_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(new Date().setDate(new Date().getDate() + 90)), // Adds 90 days dynamically
    },
  },
  {
    sequelize,
    modelName: 'tenant',
    tableName: 'tenants',
    timestamps: false, // Set to true if you need createdAt & updatedAt columns
  }
);

module.exports = Tenant;
