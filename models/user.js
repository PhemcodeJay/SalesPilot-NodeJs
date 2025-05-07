module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    confirm_password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'inactive',
    },
    role: {
      type: DataTypes.ENUM('sales', 'admin', 'manager'),
      defaultValue: 'sales',
    },
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  User.associate = (models) => {
    // One User belongs to one Tenant
    User.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return User;
};
