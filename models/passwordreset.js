module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    id: {
      type: DataTypes.UUID,  // Changed to UUID for consistency with other models
      defaultValue: DataTypes.UUIDV4,  // Automatically generate UUID
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,  // Changed to UUID to match the `User` model foreign key type
      allowNull: false,
      references: {
        model: 'users',  // Ensure this is the correct table name for users
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
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),  // Auto-sets creation time
    },
  }, {
    timestamps: true,
    tableName: 'password_resets',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false, // No need for 'updated_at' since it’s not needed
  });

  // Logic to set expiration time before creating the password reset
  PasswordReset.beforeCreate((passwordReset, options) => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1); // Default expiration: 1 hour from creation
    passwordReset.expires_at = expirationTime;
  });

  // Associations
  PasswordReset.associate = (models) => {
    PasswordReset.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',  // Ensures deletion of password resets when the user is deleted
    });
  };

  return PasswordReset;
};
