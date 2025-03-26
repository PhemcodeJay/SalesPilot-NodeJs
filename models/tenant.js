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
   */
  static async getAllTenants() {
    return await Tenant.findAll();
  }

  /**
   * Find a tenant by ID
   */
  static async getTenantById(id) {
    if (!id) throw new Error('Tenant ID is required');
    return await Tenant.findByPk(id);
  }

  /**
   * Find a tenant by email
   */
  static async getTenantByEmail(email) {
    if (!email || typeof email !== 'string') throw new Error('Valid email is required');
    return await Tenant.findOne({ where: { email } });
  }

  /**
   * Update a tenant's details
   */
  static async updateTenant(id, updates) {
    if (!id) throw new Error('Tenant ID is required');
    if (!updates || typeof updates !== 'object') throw new Error('Valid updates object is required');

    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new Error('Tenant not found');

    await tenant.update(updates);
    return tenant;
  }

  /**
   * Delete a tenant by ID
   */
  static async deleteTenant(id) {
    if (!id) throw new Error('Tenant ID is required');
    return (await Tenant.destroy({ where: { id } })) > 0;
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
