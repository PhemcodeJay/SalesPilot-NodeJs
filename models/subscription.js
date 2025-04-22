module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,  // UUID for consistency with User and Tenant models
      defaultValue: DataTypes.UUIDV4,  // Automatically generate UUID
      primaryKey: true,
      allowNull: false,
    },
    tenant_id: {
      type: DataTypes.UUID,  // UUID for tenant_id to match Tenant model
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,  // UUID for user_id to match User model
      allowNull: false,
      references: {
        model: 'users',  // Ensure this references the correct table
        key: 'id',
      },
    },
    subscription_plan: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      allowNull: false,
      defaultValue: 'trial',
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Active',
    },
    is_free_trial_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    timestamps: true,
    tableName: 'subscriptions',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Subscription.associate = (models) => {
    // A Subscription belongs to a Tenant (Many-to-One relationship)
    Subscription.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
    });

    // A Subscription belongs to a User (Many-to-One relationship)
    Subscription.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return Subscription;
};
