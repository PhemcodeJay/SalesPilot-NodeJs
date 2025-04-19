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
      references: {
        model: 'users', // Linking to the User model
        key: 'id',
      },
    },
    reset_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  }, {
    timestamps: true,
    tableName: 'password_resets',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false, // No need for 'updated_at'
  });

  // PasswordReset logic
  PasswordReset.beforeCreate((passwordReset, options) => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1); // Default expiration is 1 hour
    passwordReset.expires_at = expirationTime;
  });

  // Define associations
  PasswordReset.associate = (models) => {
    PasswordReset.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return PasswordReset;
};
