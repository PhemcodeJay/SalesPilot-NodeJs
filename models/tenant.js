const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Import Sequelize instance

/**
 * Define Tenant Model
 */
class Tenant extends Model {
  /**
   * Define model associations
   * Associates tenants with users and subscriptions
   * @param {Object} models - Sequelize models
   */
  static associate(models) {
    // Tenant has many users
    Tenant.hasMany(models.User, { 
      foreignKey: 'tenant_id', 
      as: 'users', 
      onDelete: 'CASCADE' 
    });

    // Tenant has many subscriptions
    Tenant.hasMany(models.Subscription, { 
      foreignKey: 'tenant_id', 
      as: 'subscriptions', 
      onDelete: 'CASCADE' 
    });
  }

  /**
   * Fetch all tenants
   * @returns {Promise<Array>} - List of all tenants
   */
  static async getAllTenants() {
    try {
      return await Tenant.findAll();
    } catch (error) {
      console.error('❌ Error fetching all tenants:', error);
      throw error;
    }
  }

  /**
   * Find a tenant by ID
   * @param {UUID} id - Tenant ID
   * @returns {Promise<Tenant|null>} - Found tenant or null
   */
  static async getTenantById(id) {
    if (!id) throw new Error('❌ Tenant ID is required');
    try {
      return await Tenant.findByPk(id);
    } catch (error) {
      console.error(`❌ Error fetching tenant with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new tenant
   * @param {Object} tenantData - Tenant details
   * @returns {Promise<Tenant>} - Created tenant
   */
  static async createTenant(tenantData) {
    try {
      return await Tenant.create(tenantData);
    } catch (error) {
      console.error('❌ Error creating tenant:', error);
      throw error;
    }
  }

  /**
   * Update a tenant by ID
   * @param {UUID} id - Tenant ID
   * @param {Object} updates - Updated fields
   * @returns {Promise<[number, Tenant[]]>} - Update result
   */
  static async updateTenant(id, updates) {
    if (!id) throw new Error('❌ Tenant ID is required for update');
    try {
      return await Tenant.update(updates, { where: { id } });
    } catch (error) {
      console.error(`❌ Error updating tenant with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a tenant by ID
   * @param {UUID} id - Tenant ID
   * @returns {Promise<number>} - Number of deleted records
   */
  static async deleteTenant(id) {
    if (!id) throw new Error('❌ Tenant ID is required for deletion');
    try {
      return await Tenant.destroy({ where: { id } });
    } catch (error) {
      console.error(`❌ Error deleting tenant with ID ${id}:`, error);
      throw error;
    }
  }
}

// Define Tenant Schema
Tenant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'inactive',
    },
    subscription_type: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      defaultValue: 'trial',
    },
    subscription_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    subscription_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    timestamps: true,
  }
);

module.exports = Tenant;
