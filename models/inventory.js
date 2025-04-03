const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

// Inventory Model Definition
const Inventory = sequelize.define(
  "Inventory",
  {
    inventory_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: "Product ID must be an integer",
        },
      },
    },
    sales_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: "Sales quantity must be an integer",
        },
        min: {
          args: [0],
          msg: "Sales quantity cannot be negative",
        },
      },
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    stock_qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: "Stock quantity must be an integer",
        },
        min: {
          args: [0],
          msg: "Stock quantity cannot be negative",
        },
      },
    },
    supply_qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: "Supply quantity must be an integer",
        },
        min: {
          args: [0],
          msg: "Supply quantity cannot be negative",
        },
      },
    },
    // Using virtual attributes to calculate available stock and inventory quantity
    available_stock: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.stock_qty || 0) + (this.supply_qty || 0) - (this.sales_qty || 0);
      },
    },
    inventory_qty: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.stock_qty || 0) + (this.supply_qty || 0);
      },
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "inventory",
    timestamps: false, // Prevent Sequelize from auto-generating `createdAt` & `updatedAt`
    underscored: true, // Uses snake_case for column names
  }
);

// CRUD Operations using Sequelize

// ✅ Create a new inventory entry
const createInventory = async (inventoryData) => {
  try {
    const inventory = await Inventory.create(inventoryData);
    console.log("✅ Inventory created:", inventory);
    return inventory;
  } catch (error) {
    console.error("❌ Error creating inventory:", error.message);
  }
};

// ✅ Read inventory entry by product ID
const getInventoryByProductId = async (productId) => {
  try {
    const inventory = await Inventory.findOne({
      where: { product_id: productId },
    });
    if (!inventory) {
      console.log("❌ No inventory found for product ID:", productId);
    }
    return inventory;
  } catch (error) {
    console.error("❌ Error retrieving inventory:", error.message);
  }
};

// ✅ Update inventory entry by product ID
const updateInventoryByProductId = async (productId, updateData) => {
  try {
    const [updatedRows] = await Inventory.update(updateData, {
      where: { product_id: productId },
    });
    if (updatedRows === 0) {
      console.log("❌ No inventory updated for product ID:", productId);
    } else {
      console.log("✅ Inventory updated for product ID:", productId);
    }
  } catch (error) {
    console.error("❌ Error updating inventory:", error.message);
  }
};

// ✅ Delete inventory entry by product ID
const deleteInventoryByProductId = async (productId) => {
  try {
    const deletedRows = await Inventory.destroy({
      where: { product_id: productId },
    });
    if (deletedRows === 0) {
      console.log("❌ No inventory found to delete for product ID:", productId);
    } else {
      console.log("✅ Inventory deleted for product ID:", productId);
    }
  } catch (error) {
    console.error("❌ Error deleting inventory:", error.message);
  }
};

// ✅ Sync model with database (Ensures table exists before queries)
const syncInventoryTable = async () => {
  try {
    await Inventory.sync();
    console.log("✅ Inventory table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Inventory table:", error.message);
  }
};

module.exports = {
  Inventory,
  createInventory,
  getInventoryByProductId,
  updateInventoryByProductId,
  deleteInventoryByProductId,
  syncInventoryTable,
};
