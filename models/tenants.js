module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
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
      allowNull: false,
      defaultValue: 'inactive',
    },
    subscription_type: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      allowNull: false,
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
    created_at: {
      type: DataTypes.DATE, // Changed to DataTypes.DATE
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE, // Changed to DataTypes.DATE
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: false, // Disable automatic timestamps
    tableName: 'tenants',
    underscored: true,
    paranoid: true, // Soft delete support
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });

  Tenant.associate = (models) => {
    // One Tenant has one User
    Tenant.hasOne(models.User, {
      foreignKey: 'tenant_id',
      as: 'user',
      onDelete: 'CASCADE',
    });

    // One Tenant has one Subscription
    Tenant.hasOne(models.Subscription, {
      foreignKey: 'tenant_id',
      as: 'subscription',
      onDelete: 'CASCADE',
    });
  };

  return Tenant;
};
