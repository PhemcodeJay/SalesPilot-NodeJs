module.exports = (sequelize, DataTypes) => {
    const Subscription = sequelize.define(
      "subscriptions",
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
        plan_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("active", "cancelled", "expired"),
          defaultValue: "active",
        },
        start_date: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        end_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        is_free_trial: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        payment_details: {
          type: DataTypes.JSON,
          allowNull: true,
        },
      },
      {
        tableName: "subscriptions",
        timestamps: true,
      }
    );
  
    return Subscription;
  };
  