module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    plan_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    plan_description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    plan_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    subscription_status: {
      type: DataTypes.ENUM('active', 'inactive', 'expired'),
      allowNull: false,
    },
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Subscription;
};
