module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
  });

  User.associate = (models) => {
    User.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
    });

    User.hasOne(models.Subscription, {
      foreignKey: 'user_id',
      as: 'subscription',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.ActivationCode, {
      foreignKey: 'user_id',
      as: 'activationCodes',
      onDelete: 'CASCADE',
    });
  };

  return User;
};
