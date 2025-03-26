const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

// Define Invoices Table
const Invoice = sequelize.define(
  "Invoice",
  {
    invoice_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    invoice_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    order_status: {
      type: DataTypes.ENUM("Paid", "Unpaid"),
      allowNull: false,
    },
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mode_of_payment: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.subtotal - this.subtotal * (this.discount / 100);
      },
    },
  },
  {
    tableName: "invoices",
    timestamps: false,
    underscored: true,
  }
);

// Define Invoice Items Table
const InvoiceItem = sequelize.define(
  "InvoiceItem",
  {
    invoice_items_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Invoice,
        key: "invoice_id",
      },
      onDelete: "CASCADE",
    },
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.qty * this.price;
      },
    },
  },
  {
    tableName: "invoice_items",
    timestamps: false,
    underscored: true,
  }
);

// Set Invoice → InvoiceItem Relationship
Invoice.hasMany(InvoiceItem, { foreignKey: "invoice_id", as: "items" });
InvoiceItem.belongsTo(Invoice, { foreignKey: "invoice_id" });

// Sync Tables
const syncInvoiceTables = async () => {
  try {
    await Invoice.sync();
    await InvoiceItem.sync();
    console.log("✅ Invoices & Invoice Items tables created or already exist.");
  } catch (error) {
    console.error("❌ Error syncing tables:", error.message);
  }
};

module.exports = { Invoice, InvoiceItem, syncInvoiceTables };
