module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "Subscription",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subscription_plan: {
        type: DataTypes.ENUM("trial", "starter", "business", "enterprise"),
        allowNull: false,
        defaultValue: "trial",
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
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "Active",
      },
      is_free_trial_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      tenant_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "subscriptions",
      timestamps: false, // You manage timestamps manually
    }
  );

  // 🔗 Model Associations
  Subscription.associate = (models) => {
    Subscription.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Subscription.belongsTo(models.Tenant, { foreignKey: "tenant_id", as: "tenant" });
  };

  return Subscription;
};
