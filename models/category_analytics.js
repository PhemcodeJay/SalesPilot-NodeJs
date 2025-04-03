const { sequelize, models } = require("../config/db.js"); // Import models

const CategoryAnalytics = models.CategoryAnalytics; // Use centralized model

/**
 * Sync model with the database (Create table if it doesn't exist)
 */
const syncCategoryAnalyticsTable = async () => {
  try {
    await CategoryAnalytics.sync();
    console.log("✅ Category Analytics table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Category Analytics table:", error.message);
    throw new Error("Failed to sync Category Analytics table.");
  }
};

module.exports = { 
  CategoryAnalytics, 
  syncCategoryAnalyticsTable 
};
