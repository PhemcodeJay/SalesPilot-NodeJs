module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Generates UUID by default
      primaryKey: true, // Primary key for Tenant
      allowNull: false, // Ensures the ID is not null
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Tenant name cannot be null
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false, // Tenant email cannot be null
      unique: true, // Ensure email is unique for each tenant
      validate: {
        isEmail: true, // Email format validation
      },
    },
    phone: DataTypes.STRING, // Optional phone number
    address: DataTypes.STRING, // Optional address
    status: {
      type: DataTypes.ENUM('active', 'inactive'), // Tenant status
      defaultValue: 'inactive', // Default value is 'inactive'
    },
    subscription_type: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'), // Subscription types
      defaultValue: 'trial', // Default to 'trial' subscription
      allowNull: false, // Subscription type must be provided
    },
    subscription_start_date: {
      type: DataTypes.DATE,
      allowNull: false, // Start date is mandatory
    },
    subscription_end_date: {
      type: DataTypes.DATE,
      allowNull: false, // End date is mandatory
    },
  }, {
    timestamps: true, // Timestamps for createdAt and updatedAt
    tableName: 'tenants', // Specify the table name
    underscored: true, // Use snake_case for column names
  });

  // Associations
  Tenant.associate = (models) => {
    // A Tenant has many Users, using 'tenant_id' as foreign key
    Tenant.hasMany(models.User, {
      foreignKey: 'tenant_id', // Foreign key in User model
      as: 'users', // Alias for the association
      onDelete: 'CASCADE', // Delete all users when the tenant is deleted
    });
  };

  return Tenant;
};
