module.exports = (sequelize, DataTypes) => {
  const ActivationCode = sequelize.define('ActivationCode', {
    id: {
      type: DataTypes.UUID,  // Changed to UUID for consistency across all models
      defaultValue: DataTypes.UUIDV4,  // Automatically generate UUID
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,  // Changed to UUID to match the `User` model foreign key type
      allowNull: false,
      references: {
        model: 'users',  // Ensure this references the correct table name for users
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

  // Logic to set expiration time before creating the activation code
  ActivationCode.beforeCreate((activationCode, options) => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24); // Default expiration: 24 hours from creation
    activationCode.expires_at = expirationTime;
  });

  // Associations
  ActivationCode.associate = (models) => {
    // An ActivationCode belongs to one User (one-to-one relationship)
    ActivationCode.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',  // Ensures deletion of activation codes when the user is deleted
    });

    // If you want to associate with the Tenant model as well:
    ActivationCode.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
    });
  };

  // Hook to auto-insert activation code when User is created
  ActivationCode.addHook('afterCreate', async (activationCode, options) => {
    try {
      // In case you need to do additional work or send an email when an activation code is generated
      console.log('Activation code created for user:', activationCode.user_id);
    } catch (error) {
      console.error('❌ Error after creating activation code:', error.message);
    }
  });

  return ActivationCode;
};
