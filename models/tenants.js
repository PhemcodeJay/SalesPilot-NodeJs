module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
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
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'inactive',
    },
    subscription_type: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      defaultValue: 'trial',
      allowNull: false,
    },
    subscription_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    subscription_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'tenants',
    underscored: true,
  });

  Tenant.associate = (models) => {
    Tenant.hasMany(models.User, {
      foreignKey: 'tenant_id',
      as: 'users',
      onDelete: 'CASCADE',
    });
  };

  return Tenant;
};
