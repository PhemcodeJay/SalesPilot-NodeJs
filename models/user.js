module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
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
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('sales', 'admin', 'manager'),
      allowNull: false,
      defaultValue: 'sales',
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  User.associate = (models) => {
    // Belongs to Tenant
    User.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Has many ActivationCodes
    User.hasMany(models.ActivationCode, {
      foreignKey: 'user_id',
      as: 'activationCodes',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Has many PasswordResets
    User.hasMany(models.PasswordReset, {
      foreignKey: 'user_id',
      as: 'passwordResets',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return User;
};
