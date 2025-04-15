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
        unique: true, // Make the activation code unique
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      timestamps: false, // Disable automatic timestamp fields (we manage them manually)
      tableName: 'activation_codes',
      underscored: true, // Follow snake_case for column names
    });
  
    // Associations
    ActivationCode.associate = (models) => {
      // Assuming `User` model exists
      ActivationCode.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE', // Optional: Ensure activation codes are deleted when a user is deleted
      });
    };
  
    return ActivationCode;
  };
  