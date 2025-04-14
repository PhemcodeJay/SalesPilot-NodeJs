module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // ❌ No `references` here — will avoid Sequelize trying to resolve an undefined table
    },
    reset_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  }, {
    timestamps: true,
    tableName: 'password_resets',
    underscored: true,
  });

  return PasswordReset;
};
