const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const User = require('./user');

const PasswordReset = sequelize.define('PasswordReset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  reset_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'password_resets',
  underscored: true,
});

PasswordReset.belongsTo(User, { foreignKey: 'user_id' });

module.exports = PasswordReset;
