module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,  // Use UUID for consistency with Tenant
      defaultValue: DataTypes.UUIDV4, // Automatically generate UUID
      primaryKey: true,
      allowNull: false,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',  // Link to the tenants table
        key: 'id',
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('sales', 'admin', 'manager'),
      allowNull: false,
      defaultValue: 'sales',
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'inactive',
    },
    activation_token: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    reset_token: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    reset_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'users',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Associations
  User.associate = (models) => {
    // A User belongs to one Tenant (one-to-one relationship)
    User.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',  // If tenant is deleted, the user should also be deleted
    });

    // A User has one Subscription (one-to-one relationship)
    User.hasOne(models.Subscription, {
      foreignKey: 'user_id',
      as: 'subscription',
      onDelete: 'CASCADE',  // If user is deleted, subscription should be deleted
    });

    // A User can have many ActivationCodes (one-to-many relationship)
    User.hasMany(models.ActivationCode, {
      foreignKey: 'user_id',
      as: 'activationCodes',
      onDelete: 'CASCADE',  // If user is deleted, activation codes should also be deleted
    });
  };

  return User;
};
