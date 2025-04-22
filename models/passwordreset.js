module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    id: {
      type: DataTypes.UUID,  // UUID for consistency
      defaultValue: DataTypes.UUIDV4,  // Auto-generate UUID
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,  // Foreign key for the User model
      allowNull: false,
      references: {
        model: 'users',  // Ensure this is referencing the correct table
        key: 'id',
      },
    },
    reset_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,  // Ensure reset code is unique
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
    updatedAt: false,  // No need for 'updated_at'
  });

  // Logic to set expiration time before creating the password reset record
  PasswordReset.beforeCreate((passwordReset) => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);  // Default expiration time: 1 hour from creation
    passwordReset.expires_at = expirationTime;
  });

  // Associations
  PasswordReset.associate = (models) => {
    PasswordReset.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',  // Ensures deletion of password reset entries when the user is deleted
    });
  };

  return PasswordReset;
};
