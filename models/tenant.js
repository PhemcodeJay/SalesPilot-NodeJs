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
      if (!id) throw new Error('Tenant ID is required');
      return await Tenant.findByPk(id);
    } catch (error) {
      console.error('Error fetching tenant by ID:', error);
      throw new Error('Failed to retrieve tenant.');
    }
  }

  /**
   * Find a tenant by email
   * @param {string} email - Tenant email
   * @returns {Promise<Tenant|null>}
   */
  static async getTenantByEmail(email) {
    try {
      if (!email || typeof email !== 'string') throw new Error('Valid email is required');
      return await Tenant.findOne({ where: { email } });
    } catch (error) {
      console.error('Error fetching tenant by email:', error);
      throw new Error('Failed to retrieve tenant.');
    }
  }

  /**
   * Update a tenant's details
   * @param {string} id - Tenant ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Tenant|null>}
   */
  static async updateTenant(id, updates) {
    try {
      if (!id) throw new Error('Tenant ID is required');
      if (!updates || typeof updates !== 'object') throw new Error('Valid updates object is required');

      const tenant = await Tenant.findByPk(id);
      if (!tenant) throw new Error('Tenant not found');

      await tenant.update(updates);
      return tenant;
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw new Error('Failed to update tenant.');
    }
  }

  /**
   * Delete a tenant by ID
   * @param {string} id - Tenant ID
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  static async deleteTenant(id) {
    try {
      if (!id) throw new Error('Tenant ID is required');

      const deleted = await Tenant.destroy({ where: { id } });
      return deleted > 0;
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw new Error('Failed to delete tenant.');
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
