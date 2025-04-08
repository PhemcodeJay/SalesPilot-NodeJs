const { models } = require("../config/db.js"); // Import models from centralized db.js

const Inventory = models.Inventory; // Use the centralized Inventory model

// ===== Sync model with database (Creates table if not exists) =====
const syncInventoryTable = async () => {
  try {
    await Inventory.sync(); // Sync the table with the database
    console.log("✅ Inventory table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Inventory table:", error.message);
    throw new Error("Failed to sync Inventory table.");
  }
};

// ===== CRUD Operations =====

// ✅ Create a new inventory entry
const createInventory = async (inventoryData) => {
  try {
    const inventory = await Inventory.create(inventoryData); // Create new inventory entry
    console.log("✅ Inventory created:", inventory);
    return inventory;
  } catch (error) {
    console.error("❌ Error creating inventory:", error.message);
    throw new Error("Failed to create inventory.");
  }
};

// ✅ Get inventory by product ID
const getInventoryByProductId = async (productId) => {
  try {
    const inventory = await Inventory.findOne({
      where: { product_id: productId },
    });
    if (!inventory) {
      console.log("❌ No inventory found for product ID:", productId);
      return null; // Return null if no inventory is found
    }
    return inventory;
  } catch (error) {
    console.error("❌ Error retrieving inventory:", error.message);
    throw new Error("Failed to retrieve inventory.");
  }
};

// ✅ Update inventory by product ID
const updateInventoryByProductId = async (productId, updateData) => {
  try {
    const [updatedRows] = await Inventory.update(updateData, {
      where: { product_id: productId },
    });
    if (updatedRows === 0) {
      console.log("❌ No inventory updated for product ID:", productId);
      return null; // Return null if no rows were updated
    }
    console.log("✅ Inventory updated for product ID:", productId);
    return updatedRows;
  } catch (error) {
    console.error("❌ Error updating inventory:", error.message);
    throw new Error("Failed to update inventory.");
  }
};

// ✅ Delete inventory by product ID
const deleteInventoryByProductId = async (productId) => {
  try {
    const deletedRows = await Inventory.destroy({
      where: { product_id: productId },
    });
    if (deletedRows === 0) {
      console.log("❌ No inventory found to delete for product ID:", productId);
      return null; // Return null if no rows were deleted
    }
    console.log("✅ Inventory deleted for product ID:", productId);
    return deletedRows;
  } catch (error) {
    console.error("❌ Error deleting inventory:", error.message);
    throw new Error("Failed to delete inventory.");
  }
};

// ===== Export CRUD functions and sync method =====
module.exports = {
  syncInventoryTable,
  createInventory,
  getInventoryByProductId,
  updateInventoryByProductId,
  deleteInventoryByProductId,
};
