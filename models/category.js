const { models } = require("../config/db.js"); // Import models from centralized db.js

const Category = models.Category; // Use centralized Category model

// Sync model with the database (Creates table if not exists)
const createCategoriesTable = async () => {
  try {
    await Category.sync();
    console.log("✅ Categories table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating categories table:", error.message);
    throw new Error("Failed to create categories table.");
  }
};

// CRUD Operations

// Insert a new category
const createCategory = async ({ category_name, description }) => {
  try {
    return await Category.create({ category_name, description });
  } catch (error) {
    console.error("❌ Error creating category:", error.message);
    throw new Error(`Failed to create category: ${error.message}`);
  }
};

// Get a single category by ID
const getCategoryById = async (category_id) => {
  try {
    const category = await Category.findOne({ where: { category_id } });
    if (!category) throw new Error("Category not found.");
    return category;
  } catch (error) {
    console.error("❌ Error fetching category:", error.message);
    throw new Error(`Failed to fetch category: ${error.message}`);
  }
};

// Get all categories
const getAllCategories = async () => {
  try {
    return await Category.findAll({ order: [['created_at', 'DESC']] });
  } catch (error) {
    console.error("❌ Error fetching categories:", error.message);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
};

// Update a category
const updateCategory = async (category_id, { category_name, description }) => {
  try {
    const result = await Category.update(
      { category_name, description },
      { where: { category_id } }
    );
    return result[0] > 0; // Returns true if rows were updated
  } catch (error) {
    console.error("❌ Error updating category:", error.message);
    throw new Error(`Failed to update category: ${error.message}`);
  }
};

// Delete a category
const deleteCategory = async (category_id) => {
  try {
    const result = await Category.destroy({ where: { category_id } });
    return result > 0; // Returns true if rows were deleted
  } catch (error) {
    console.error("❌ Error deleting category:", error.message);
    throw new Error(`Failed to delete category: ${error.message}`);
  }
};

// Export methods and sync
module.exports = {
  createCategoriesTable,
  createCategory,
  getCategoryById,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
