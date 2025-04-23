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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'tenants',
    timestamps: true,
    underscored: true,
    paranoid: true, // enables soft deletes
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });

  Tenant.associate = (models) => {
    // One Tenant has many Users
    Tenant.hasMany(models.User, {
      foreignKey: 'tenant_id',
      as: 'users',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // One Tenant has one Subscription
    Tenant.hasOne(models.Subscription, {
      foreignKey: 'tenant_id',
      as: 'subscription',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Tenant;
};
