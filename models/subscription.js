module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_id: {
      type: DataTypes.UUID, // Ensures UUID for tenant_id
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID, // Changed to UUID to match User model
      allowNull: false,
      references: {
        model: 'users', // Ensure this is the correct table name
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
  });

  Subscription.associate = (models) => {
    // Each Subscription is linked to a Tenant (One-to-One)
    Subscription.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
    });

    // Each Subscription is linked to a User (One-to-One)
    Subscription.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return Subscription;
};
