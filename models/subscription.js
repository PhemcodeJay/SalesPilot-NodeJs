module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
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
      type: DataTypes.ENUM('Active', 'Pending', 'Expired', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Active',
    },
    is_free_trial_used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    features: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    renewal_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_renewal_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellation_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  }, {
    tableName: 'subscriptions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['tenant_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['end_date'],
      },
      {
        fields: ['subscription_plan'],
      },
    ],
    hooks: {
      beforeCreate: (subscription) => {
        // Ensure features are stored as JSON
        if (typeof subscription.features === 'string') {
          try {
            subscription.features = JSON.parse(subscription.features);
          } catch (e) {
            subscription.features = [];
          }
        }
      },
    },
  });

  // Class Methods
  Subscription.findActiveByTenant = async function(tenantId, transaction) {
    return this.findOne({
      where: {
        tenant_id: tenantId,
        status: 'Active',
        end_date: { [sequelize.Op.gt]: new Date() },
      },
      order: [['created_at', 'DESC']],
      transaction,
    });
  };

  Subscription.findExpired = async function(transaction, limit = 1000) {
    return this.findAll({
      where: {
        status: 'Expired',
        end_date: { [sequelize.Op.lt]: new Date() },
      },
      limit,
      transaction,
    });
  };

  // Instance Methods
  Subscription.prototype.renew = async function(durationMonths, transaction) {
    const now = new Date();
    const newEndDate = new Date(now);
    newEndDate.setMonth(now.getMonth() + durationMonths);

    this.start_date = now;
    this.end_date = newEndDate;
    this.status = 'Active';
    this.renewal_attempts += 1;
    this.last_renewal_at = now;

    return this.save({ transaction });
  };

  Subscription.prototype.cancel = async function(reason = null, transaction) {
    this.status = 'Cancelled';
    this.cancellation_reason = reason;
    return this.save({ transaction });
  };

  // Associations
  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
    });

    // Add hasMany relationship from Tenant to Subscription
    models.Tenant.hasMany(Subscription, {
      foreignKey: 'tenant_id',
      as: 'subscriptions',
    });
  };

  return Subscription;
};