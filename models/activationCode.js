const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); // Use the configured database connection

class ActivationCode extends Model {}

ActivationCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activation_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
  },
  {
    sequelize,
    modelName: 'ActivationCode',
    tableName: 'activation_codes',
    timestamps: false,
  }
);

module.exports = ActivationCode;
