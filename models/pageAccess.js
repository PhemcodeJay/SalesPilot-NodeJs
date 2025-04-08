const { models } = require("../config/db.js"); // Import models from centralized db.js
const { Sequelize, DataTypes, Model } = require('sequelize');

// Use the centralized sequelize instance from db.js
const sequelize = models.sequelize;

// ===== Define PageAccess Model =====
class PageAccess extends Model {}

PageAccess.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  page: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Page name cannot be empty" },
    },
  },
  required_access_level: {
    type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['trial', 'starter', 'business', 'enterprise']],
        msg: "Access level must be one of 'trial', 'starter', 'business', or 'enterprise'",
      },
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at', // Matches SQL column
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at', // Matches SQL column
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
  },
}, {
  sequelize,  // Sequelize instance from db.js
  modelName: 'PageAccess',
  tableName: 'page_access',
  timestamps: true, // Automatically handles createdAt & updatedAt
  underscored: true, // Converts camelCase to snake_case columns
});

// Sync Database (Creates table if it doesn't exist)
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true }); // `alter: true` ensures table updates without data loss
    console.log('✅ PageAccess table synced successfully');
  } catch (error) {
    console.error('❌ Error syncing PageAccess table:', error.message);
  }
}

syncDatabase();

module.exports = PageAccess;
