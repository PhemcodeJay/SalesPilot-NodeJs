const { sequelize, DataTypes } = require("../config/db.js"); // Use centralized DB connection

/**
 * Category Analytics Model Definition
 */
const CategoryAnalytics = sequelize.define("CategoryAnalytics", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  revenue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  profit_margin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  year_over_year_growth: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cost_of_selling: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  inventory_turnover_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  stock_to_sales_ratio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  sell_through_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  gross_margin_by_category: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  net_margin_by_category: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  gross_margin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  net_margin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  total_sales: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_profit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_expenses: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  net_profit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  revenue_by_category: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  most_sold_product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'category_analytics',
  timestamps: false, // Disable Sequelize's auto timestamps
  underscored: true, // Use snake_case column names
});

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
