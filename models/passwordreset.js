const { models } = require("../config/db.js"); // Import models from centralized db.js
const { Sequelize, DataTypes, Model } = require('sequelize');

// Use the centralized sequelize instance from db.js
const sequelize = models.sequelize;

// ===== Define PasswordReset Model =====
class PasswordReset extends Model {}

PasswordReset.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: "User ID must be an integer",
      },
      notNull: {
        msg: "User ID is required",
      },
    },
  },
  reset_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Reset code cannot be empty",
      },
      len: {
        args: [6, 100], // Reset code must be at least 6 characters
        msg: "Reset code must be at least 6 characters long",
      },
    },
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: "Expiration date must be a valid date",
      },
      notNull: {
        msg: "Expiration date is required",
      },
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
  },
}, {
  sequelize,
  modelName: 'PasswordReset',
  tableName: 'password_resets',
  timestamps: false,
  underscored: true, // Convert column names to snake_case
});

// Sync Database (Creates table if it doesn't exist)
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true }); // `alter: true` ensures table updates without data loss
    console.log('✅ PasswordReset table synced successfully');
  } catch (error) {
    console.error('❌ Error syncing PasswordReset table:', error.message);
  }
}

syncDatabase();

module.exports = PasswordReset;
