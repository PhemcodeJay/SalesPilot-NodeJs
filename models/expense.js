const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

const Expense = sequelize.define(
  "Expense",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "expenses",
    timestamps: true, // Enables automatic `createdAt` and `updatedAt`
    underscored: true, // Uses snake_case for column names
  }
);

// ✅ Sync model with database (Creates table if not exists)
const syncExpenseTable = async () => {
  try {
    await Expense.sync();
    console.log("✅ Expenses table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Expenses table:", error.message);
  }
};

module.exports = { Expense, syncExpenseTable };
