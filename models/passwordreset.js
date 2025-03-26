module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define(
    "PasswordReset",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reset_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "password_resets",
      timestamps: false,
    }
  );

  return PasswordReset;
};
