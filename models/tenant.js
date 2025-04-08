module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define(
    "Tenant",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "inactive",
      },
      subscription_type: {
        type: DataTypes.ENUM("trial", "starter", "business", "enterprise"),
        defaultValue: "trial",
      },
      subscription_start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      subscription_end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "tenants",
      timestamps: true,
    }
  );

  // 🔗 Associations
  Tenant.associate = (models) => {
    Tenant.hasMany(models.User, {
      foreignKey: "tenant_id",
      as: "users",
      onDelete: "CASCADE",
    });

    Tenant.hasMany(models.Subscription, {
      foreignKey: "tenant_id",
      as: "subscriptions",
      onDelete: "CASCADE",
    });
  };

  return Tenant;
};
