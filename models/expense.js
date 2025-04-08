const { models } = require("../config/db.js"); // Import models from centralized db.js

const Expense = models.Expense; // Use the centralized Expense model

// Sync model with database (Creates table if not exists)
const syncExpenseTable = async () => {
  try {
    await Expense.sync(); // Sync the Expense table
    console.log("✅ Expenses table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Expenses table:", error.message);
    throw new Error("Failed to sync Expenses table.");
  }
};

// CRUD Operations

// Get all expenses
const getAllExpenses = async () => {
  try {
    return await Expense.findAll(); // Fetch all expense records
  } catch (error) {
    console.error("❌ Error fetching expenses:", error.message);
    throw new Error("Failed to fetch expenses.");
  }
};

// Get expense by ID
const getExpenseById = async (expenseId) => {
  try {
    return await Expense.findOne({ where: { expense_id: expenseId } }); // Fetch expense by ID
  } catch (error) {
    console.error("❌ Error fetching expense by ID:", error.message);
    throw new Error("Failed to fetch expense by ID.");
  }
};

// Create a new expense
const createExpense = async (expenseData) => {
  try {
    const expense = await Expense.create(expenseData); // Create new expense record
    console.log(`✅ Expense created: ${expense.description}`);
    return expense;
  } catch (error) {
    console.error("❌ Error creating expense:", error.message);
    throw new Error("Failed to create expense.");
  }
};

// Update an existing expense
const updateExpense = async (expenseId, updatedData) => {
  try {
    const expense = await Expense.findOne({ where: { expense_id: expenseId } });
    if (!expense) throw new Error("Expense not found."); // Check if expense exists

    await expense.update(updatedData); // Update expense record
    console.log(`✅ Expense updated: ${expense.description}`);
    return expense;
  } catch (error) {
    console.error("❌ Error updating expense:", error.message);
    throw new Error("Failed to update expense.");
  }
};

// Delete an expense
const deleteExpense = async (expenseId) => {
  try {
    const expense = await Expense.findOne({ where: { expense_id: expenseId } });
    if (!expense) throw new Error("Expense not found."); // Check if expense exists

    await expense.destroy(); // Delete expense record
    console.log(`✅ Expense deleted: ${expense.description}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting expense:", error.message);
    throw new Error("Failed to delete expense.");
  }
};

// Export methods and sync
module.exports = {
  syncExpenseTable,
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
