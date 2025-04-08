const { models } = require("../config/db.js"); // Import models from centralized db.js
const { DataTypes, Sequelize } = require("sequelize");

// Use the centralized Invoice and InvoiceItem models from db.js
const Invoice = models.Invoice; 
const InvoiceItem = models.InvoiceItem;

// ===== CRUD Operations for Invoices =====

// ✅ Create a new invoice
const createInvoice = async (invoiceData) => {
  try {
    const invoice = await Invoice.create(invoiceData);
    console.log("✅ Invoice created:", invoice);
    return invoice;
  } catch (error) {
    throw new Error(`❌ Error creating invoice: ${error.message}`);
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
      throw new Error(`❌ No invoice found with ID: ${invoiceId}`);
    }
    return invoice;
  } catch (error) {
    throw new Error(`❌ Error retrieving invoice: ${error.message}`);
  }
};

// ✅ Update invoice by invoice_id
const updateInvoiceById = async (invoiceId, updateData) => {
  try {
    const [updatedRows] = await Invoice.update(updateData, {
      where: { invoice_id: invoiceId },
    });
    if (updatedRows === 0) {
      throw new Error(`❌ No invoice updated with ID: ${invoiceId}`);
    }
    console.log("✅ Invoice updated with ID:", invoiceId);
    return updatedRows;
  } catch (error) {
    throw new Error(`❌ Error updating invoice: ${error.message}`);
  }
};

// ✅ Delete an invoice by invoice_id
const deleteInvoiceById = async (invoiceId) => {
  try {
    const deletedRows = await Invoice.destroy({
      where: { invoice_id: invoiceId },
    });
    if (deletedRows === 0) {
      throw new Error(`❌ No invoice found to delete with ID: ${invoiceId}`);
    }
    console.log("✅ Invoice deleted with ID:", invoiceId);
    return deletedRows;
  } catch (error) {
    throw new Error(`❌ Error deleting invoice: ${error.message}`);
  }
};

// Sync Tables (Invoices & Invoice Items)
const syncInvoiceTables = async () => {
  try {
    await Invoice.sync();
    await InvoiceItem.sync();
    console.log("✅ Invoices & Invoice Items tables created or already exist.");
  } catch (error) {
    console.error("❌ Error syncing tables:", error.message);
  }
};

// ===== Export Models and Services =====
module.exports = {
  Invoice,
  InvoiceItem,
  createInvoice,
  getInvoiceById,
  updateInvoiceById,
  deleteInvoiceById,
  syncInvoiceTables, // Sync function for manual sync
};
