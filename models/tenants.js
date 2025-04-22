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
    subscription_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    subscription_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'tenants',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Tenant.associate = (models) => {
    // One Tenant has many Users
    Tenant.hasMany(models.User, {
      foreignKey: 'tenant_id',
      as: 'users',
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
