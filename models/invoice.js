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
      validate: {
        notEmpty: { msg: "Invoice number cannot be empty" },
      },
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Customer name cannot be empty" },
      },
    },
    invoice_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: { msg: "Invalid order date format" },
      },
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
      validate: {
        isDate: { msg: "Invalid due date format" },
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: "Subtotal must be a decimal value" },
        min: 0,
      },
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: "Discount must be a decimal value" },
        min: 0,
      },
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
      validate: {
        notEmpty: { msg: "Item name cannot be empty" },
      },
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: "Quantity must be an integer" },
        min: 1,
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: "Price must be a decimal value" },
        min: 0,
      },
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

// CRUD Operations for Invoices

// ✅ Create a new invoice
const createInvoice = async (invoiceData) => {
  try {
    const invoice = await Invoice.create(invoiceData);
    console.log("✅ Invoice created:", invoice);
    return invoice;
  } catch (error) {
    console.error("❌ Error creating invoice:", error.message);
  }
};

// ✅ Get an invoice by invoice_id
const getInvoiceById = async (invoiceId) => {
  try {
    const invoice = await Invoice.findOne({
      where: { invoice_id: invoiceId },
      include: [
        {
          model: InvoiceItem,
          as: "items",
        },
      ],
    });
    if (!invoice) {
      console.log("❌ No invoice found with ID:", invoiceId);
    }
    return invoice;
  } catch (error) {
    console.error("❌ Error retrieving invoice:", error.message);
  }
};

// ✅ Update invoice by invoice_id
const updateInvoiceById = async (invoiceId, updateData) => {
  try {
    const [updatedRows] = await Invoice.update(updateData, {
      where: { invoice_id: invoiceId },
    });
    if (updatedRows === 0) {
      console.log("❌ No invoice updated with ID:", invoiceId);
    } else {
      console.log("✅ Invoice updated with ID:", invoiceId);
    }
  } catch (error) {
    console.error("❌ Error updating invoice:", error.message);
  }
};

// ✅ Delete an invoice by invoice_id
const deleteInvoiceById = async (invoiceId) => {
  try {
    const deletedRows = await Invoice.destroy({
      where: { invoice_id: invoiceId },
    });
    if (deletedRows === 0) {
      console.log("❌ No invoice found to delete with ID:", invoiceId);
    } else {
      console.log("✅ Invoice deleted with ID:", invoiceId);
    }
  } catch (error) {
    console.error("❌ Error deleting invoice:", error.message);
  }
};

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

module.exports = {
  Invoice,
  InvoiceItem,
  createInvoice,
  getInvoiceById,
  updateInvoiceById,
  deleteInvoiceById,
  syncInvoiceTables,
};
