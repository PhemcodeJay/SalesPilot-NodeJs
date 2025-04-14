module.exports = (sequelize, DataTypes) => {
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
    tableName: 'subscriptions',
    underscored: true,
  });

  return Subscription;
};
