const db = require("../config/db"); // Corrected path to db.js

class Category {
  // ✅ Create the categories table if it does not exist
  static async createCategoriesTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS categories (
        category_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL,
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;

    try {
      await db.executeQuery(createTableQuery);
      console.log("✅ Categories table created or already exists.");
    } catch (error) {
      console.error("❌ Error creating categories table:", error.message);
    }
  }

  // ✅ Insert a new category
  static async createCategory({ category_name, description }) {
    const insertCategoryQuery = `
      INSERT INTO categories (category_name, description) VALUES (?, ?)
    `;

    try {
      const result = await db.executeQuery(insertCategoryQuery, [category_name, description]);
      return { category_id: result.insertId };
    } catch (error) {
      throw new Error(`❌ Error creating category: ${error.message}`);
    }
  }

  // ✅ Get a single category by ID
  static async getCategoryById(category_id) {
    const query = `SELECT * FROM categories WHERE category_id = ?`;

    try {
      const rows = await db.executeQuery(query, [category_id]);
      if (rows.length === 0) throw new Error("❌ Category not found.");
      return rows[0];
    } catch (error) {
      throw new Error(`❌ Error fetching category: ${error.message}`);
    }
  }

  // ✅ Get all categories
  static async getAllCategories() {
    const query = `SELECT * FROM categories ORDER BY created_at DESC`;

    try {
      return await db.executeQuery(query);
    } catch (error) {
      throw new Error(`❌ Error fetching categories: ${error.message}`);
    }
  }

  // ✅ Update a category
  static async updateCategory(category_id, { category_name, description }) {
    const updateQuery = `
      UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?
    `;

    try {
      const result = await db.executeQuery(updateQuery, [category_name, description, category_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`❌ Error updating category: ${error.message}`);
    }
  }

  // ✅ Delete a category
  static async deleteCategory(category_id) {
    const deleteQuery = `DELETE FROM categories WHERE category_id = ?`;

    try {
      const result = await db.executeQuery(deleteQuery, [category_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`❌ Error deleting category: ${error.message}`);
    }
  }
}

module.exports = Category;
