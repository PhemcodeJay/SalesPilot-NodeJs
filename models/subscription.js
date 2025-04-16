module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {  // Foreign key for User model
      type: DataTypes.INTEGER,  // Assuming User ID is an integer (adjust if necessary)
      allowNull: false,
      references: {
        model: 'users',  // References the User table
        key: 'id',  // Foreign key pointing to the id in the User model
      },
    },
    subscription_plan: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      defaultValue: 'trial',
      allowNull: false,  // Ensure a valid plan is always provided
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,  // Start date is mandatory
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,  // End date is mandatory
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Active',
      allowNull: false,  // Ensure status is always provided
    },
    is_free_trial_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,  // Default value to track if the free trial has been used
    },
  }, {
    timestamps: true,
    tableName: 'subscriptions',
    underscored: true,  // Use snake_case for column names
  });

  // Associations
  Subscription.associate = (models) => {
    // A Subscription belongs to a User
    Subscription.belongsTo(models.User, {
      foreignKey: 'user_id', // Foreign key
      as: 'user',  // Alias for the association
      onDelete: 'CASCADE',  // When a user is deleted, the subscription is also deleted
    });
  };

  return Subscription;
};
