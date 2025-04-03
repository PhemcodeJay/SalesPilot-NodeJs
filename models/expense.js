const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

// Expense Model Definition
const Expense = sequelize.define(
  "Expense",
  {
    expense_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Description cannot be empty",
        },
        len: {
          args: [1, 500],
          msg: "Description must be between 1 and 500 characters",
        },
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: "Amount must be a valid decimal number",
        },
        min: {
          args: [0],
          msg: "Amount cannot be negative",
        },
      },
    },
    expense_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Created by cannot be empty",
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "expenses",
    timestamps: true, // Automatically uses createdAt and updatedAt
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
    throw new Error("Failed to sync Expenses table.");
  }
};

// CRUD Operations
const getAllExpenses = async () => {
  try {
    return await Expense.findAll();
  } catch (error) {
    console.error("❌ Error fetching expenses:", error.message);
    throw new Error("Failed to fetch expenses.");
  }
};

const getExpenseById = async (expenseId) => {
  try {
    return await Expense.findOne({ where: { expense_id: expenseId } });
  } catch (error) {
    console.error("❌ Error fetching expense by ID:", error.message);
    throw new Error("Failed to fetch expense by ID.");
  }
};

const createExpense = async (expenseData) => {
  try {
    const expense = await Expense.create(expenseData);
    console.log(`✅ Expense created: ${expense.description}`);
    return expense;
  } catch (error) {
    console.error("❌ Error creating expense:", error.message);
    throw new Error("Failed to create expense.");
  }
};

const updateExpense = async (expenseId, updatedData) => {
  try {
    const expense = await Expense.findOne({ where: { expense_id: expenseId } });
    if (!expense) throw new Error("Expense not found.");

    await expense.update(updatedData);
    console.log(`✅ Expense updated: ${expense.description}`);
    return expense;
  } catch (error) {
    console.error("❌ Error updating expense:", error.message);
    throw new Error("Failed to update expense.");
  }
};

const deleteExpense = async (expenseId) => {
  try {
    const expense = await Expense.findOne({ where: { expense_id: expenseId } });
    if (!expense) throw new Error("Expense not found.");

    await expense.destroy();
    console.log(`✅ Expense deleted: ${expense.description}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting expense:", error.message);
    throw new Error("Failed to delete expense.");
  }
};

// Exporting methods and sync
module.exports = { 
  Expense, 
  syncExpenseTable, 
  getAllExpenses, 
  getExpenseById, 
  createExpense, 
  updateExpense, 
  deleteExpense 
};
