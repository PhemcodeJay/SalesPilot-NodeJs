const { Sequelize, DataTypes, Model } = require('sequelize');

// Initialize Sequelize (Replace with your DB credentials)
const sequelize = new Sequelize('salespilot', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // Disable SQL logs in the console
});

// Define PageAccess Model
class PageAccess extends Model {}

PageAccess.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    page: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    required_access_level: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PageAccess',
    tableName: 'page_access',
    timestamps: true, // Enables createdAt & updatedAt
    underscored: true, // Converts camelCase to snake_case columns
  }
);

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
