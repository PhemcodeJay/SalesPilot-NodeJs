module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
  }, {
    tableName: 'password_resets',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false,  // No need for updated_at on password resets
  });

  // Auto-set expiry before creating
  PasswordReset.beforeCreate((passwordReset) => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);
    passwordReset.expires_at = expirationTime;
  });

  PasswordReset.associate = (models) => {
    PasswordReset.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return PasswordReset;
};
