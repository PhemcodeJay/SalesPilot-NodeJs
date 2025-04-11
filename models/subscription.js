const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // 👈 correct destructure
const User = require('./user');

const Subscription = sequelize.define('Subscription', {
  subscription_plan: {
    type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
    defaultValue: 'trial',
  },
  end_date: DataTypes.DATE,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
  is_free_trial_used: DataTypes.BOOLEAN,
}, {
  timestamps: true,
});

Subscription.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Subscription;
