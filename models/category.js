const { models } = require("../config/db.js"); // Import models

const Category = models.Category; // Use centralized Category model

// Sync the model with the database
const createCategoriesTable = async () => {
  try {
    await Category.sync();
    console.log("✅ Categories table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating categories table:", error.message);
  }
};

// Insert a new category
const createCategory = async ({ category_name, description }) => {
  try {
    return await Category.create({ category_name, description });
  } catch (error) {
    throw new Error(`❌ Error creating category: ${error.message}`);
  }
};

// Get a single category by ID
const getCategoryById = async (category_id) => {
  try {
    const category = await Category.findOne({ where: { category_id } });
    if (!category) throw new Error("❌ Category not found.");
    return category;
  } catch (error) {
    throw new Error(`❌ Error fetching category: ${error.message}`);
  }
};

// Get all categories
const getAllCategories = async () => {
  try {
    return await Category.findAll({ order: [['created_at', 'DESC']] });
  } catch (error) {
    throw new Error(`❌ Error fetching categories: ${error.message}`);
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
    throw new Error(`❌ Error updating category: ${error.message}`);
  }
};

// Delete a category
const deleteCategory = async (category_id) => {
  try {
    const result = await Category.destroy({ where: { category_id } });
    return result > 0; // Returns true if rows were deleted
  } catch (error) {
    throw new Error(`❌ Error deleting category: ${error.message}`);
  }
};

module.exports = {
  createCategoriesTable,
  createCategory,
  getCategoryById,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
