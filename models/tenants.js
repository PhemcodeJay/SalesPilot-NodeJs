module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subscription_type: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      defaultValue: 'trial',
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'inactive',
    },
  }, {
    tableName: 'tenants',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Tenant.associate = (models) => {
    // One Tenant belongs to one User
    Tenant.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // One Tenant has one Subscription (created automatically when Tenant is created)
    Tenant.hasOne(models.Subscription, {
      foreignKey: 'tenant_id',
      as: 'subscription',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  // Hook to auto-insert subscription when a tenant is created
  Tenant.addHook('afterCreate', async (tenant, options) => {
    try {
      const subscriptionData = {
        tenant_id: tenant.id,
        subscription_type: tenant.subscription_type,
        start_date: new Date(), // Or any custom logic for start date
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Subscription ends in one year
      };
      
      // Create the subscription automatically after the tenant is created
      await sequelize.models.Subscription.create(subscriptionData);
    } catch (error) {
      console.error('❌ Error auto-creating subscription:', error.message);
    }
  });

  return Tenant;
};
