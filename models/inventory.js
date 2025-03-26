const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

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
    },
    sales_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    stock_qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    supply_qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    available_stock: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.stock_qty + this.supply_qty - this.sales_qty;
      },
    },
    inventory_qty: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.stock_qty + this.supply_qty;
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

// ✅ Sync model with database (Ensures table exists before queries)
const syncInventoryTable = async () => {
  try {
    await Inventory.sync();
    console.log("✅ Inventory table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Inventory table:", error.message);
  }
};

module.exports = { Inventory, syncInventoryTable };
