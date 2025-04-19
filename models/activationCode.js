module.exports = (sequelize, DataTypes) => {
  const ActivationCode = sequelize.define('ActivationCode', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  }, {
    tableName: 'activation_codes',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No need for 'updated_at'
  });

  ActivationCode.associate = (models) => {
    ActivationCode.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  // Add expiration logic if needed
  ActivationCode.beforeCreate((activationCode, options) => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 24); // Example: 24 hours expiration
    activationCode.expires_at = expirationTime;
  });

  return ActivationCode;
};
