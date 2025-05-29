module.exports = (sequelize, DataTypes) => {
  const ActivationCode = sequelize.define('ActivationCode', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    code: {
      type: DataTypes.STRING(8), // Matches the 8-character code from service
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45), // IPv6 max length
      allowNull: true,
    },
    verification_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
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
    updatedAt: 'updated_at', // Now including updated_at for tracking changes
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['tenant_id'],
      },
      {
        fields: ['expires_at'],
      },
    ],
  });

  // Set expiration time based on environment variable or default
  ActivationCode.beforeCreate((activationCode, options) => {
    const expiryHours = process.env.ACTIVATION_CODE_EXPIRY_HOURS || 24;
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + parseInt(expiryHours));
    activationCode.expires_at = expirationTime;
  });

  // Associations
  ActivationCode.associate = (models) => {
    ActivationCode.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });

    ActivationCode.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      as: 'tenant',
      onDelete: 'CASCADE',
    });

    // Add hasMany relationship if you need to track multiple codes per user
    models.User.hasMany(ActivationCode, {
      foreignKey: 'user_id',
      as: 'activationCodes',
    });
  };

  // Class methods
  ActivationCode.findValidCode = async function(code, userId, tenantId, transaction) {
    return this.findOne({
      where: {
        code,
        user_id: userId,
        tenant_id: tenantId,
        expires_at: { [sequelize.Op.gt]: new Date() },
        used_at: null,
      },
      transaction,
    });
  };

  // Instance methods
  ActivationCode.prototype.markAsUsed = async function(ipAddress = null, transaction) {
    this.used_at = new Date();
    this.verification_ip = ipAddress;
    return this.save({ transaction });
  };

  return ActivationCode;
};
