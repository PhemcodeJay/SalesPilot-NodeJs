const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Import Sequelize instance


class Tenant extends Model {
  /**
   * Define model associations
   */
  static associate(models) {
    Tenant.hasMany(models.User, { foreignKey: 'tenant_id', as: 'users', onDelete: 'CASCADE' });
    Tenant.hasMany(models.Subscription, { foreignKey: 'tenant_id', as: 'subscriptions', onDelete: 'CASCADE' });
  }

  /**
   * Fetch all tenants
   * @returns {Promise<Array<Tenant>>} List of all tenants
   */
  static async getAllTenants() {
    try {
      return await Tenant.findAll();
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw new Error('Failed to retrieve tenants.');
    }
  }

  /**
   * Find a tenant by ID
   * @param {string} id - Tenant ID
   * @returns {Promise<Tenant|null>}
   */
  static async getTenantById(id) {
    try {
      return await Tenant.findByPk(id);
    } catch (error) {
      console.error('Error fetching tenant by ID:', error);
      throw new Error('Failed to retrieve tenant.');
    }
  }
}

// ✅ Define Tenant Model
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
      unique: { msg: 'Tenant name must be unique' },
      validate: { notEmpty: { msg: 'Tenant name cannot be empty' } },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: 'Email must be unique' },
      validate: { isEmail: { msg: 'Invalid email format' } },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { is: /^[0-9+\-() ]+$/, msg: 'Invalid phone number format' },
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
    modelName: 'Tenant',
    tableName: 'tenants',
    timestamps: true, // ✅ Enables createdAt & updatedAt
  }
);

module.exports = Tenant;
