module.exports = (sequelize, DataTypes) => {
  const ActivationCode = sequelize.define('ActivationCode', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.UUID,  // Changed to UUID to match the `User` model foreign key
      allowNull: false,
      references: {
        model: 'users',  // Make sure this references the correct table
        key: 'id',
      },
    },
    activation_code: {
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
    tableName: 'activation_codes',
    underscored: true,
    timestamps: true,  // Ensures created_at and updated_at fields are managed automatically
    createdAt: 'created_at',
    updatedAt: false,  // No need for an 'updated_at' field
  });

  // Associations
  ActivationCode.associate = (models) => {
    // An ActivationCode belongs to one User (one-to-one relationship)
    ActivationCode.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',  // Ensures deletion of activation codes when the user is deleted
    });
  };

  // Logic to set expiration time before creating the activation code
  ActivationCode.beforeCreate((activationCode, options) => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24); // Default expiration: 24 hours from creation
    activationCode.expires_at = expirationTime;
  });

  return ActivationCode;
};
