const { models } = require("../config/db.js"); // Import models from centralized db.js

const Customer = models.Customer; // Use the centralized Customer model

// Sync model with database (Creates table if not exists)
const syncCustomerTable = async () => {
  try {
    await Customer.sync();
    console.log("✅ Customers table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Customers table:", error.message);
    throw new Error("Failed to sync Customers table.");
  }
};

// Allow Sequelize queries (CRUD)

// Get all customers
const getAllCustomers = async () => {
  try {
    return await Customer.findAll();
  } catch (error) {
    console.error("❌ Error fetching customers:", error.message);
    throw new Error("Failed to fetch customers.");
  }
};

// Get customer by ID
const getCustomerById = async (customerId) => {
  try {
    return await Customer.findOne({ where: { customer_id: customerId } });
  } catch (error) {
    console.error("❌ Error fetching customer by ID:", error.message);
    throw new Error("Failed to fetch customer by ID.");
  }
};

// Create a new customer
const createCustomer = async (customerData) => {
  try {
    const customer = await Customer.create(customerData);
    console.log(`✅ Customer created: ${customer.customer_name}`);
    return customer;
  } catch (error) {
    console.error("❌ Error creating customer:", error.message);
    throw new Error("Failed to create customer.");
  }
};

// Update customer details
const updateCustomer = async (customerId, updatedData) => {
  try {
    const customer = await Customer.findOne({ where: { customer_id: customerId } });
    if (!customer) throw new Error("Customer not found.");

    await customer.update(updatedData);
    console.log(`✅ Customer updated: ${customer.customer_name}`);
    return customer;
  } catch (error) {
    console.error("❌ Error updating customer:", error.message);
    throw new Error("Failed to update customer.");
  }
};

// Delete a customer
const deleteCustomer = async (customerId) => {
  try {
    const customer = await Customer.findOne({ where: { customer_id: customerId } });
    if (!customer) throw new Error("Customer not found.");

    await customer.destroy();
    console.log(`✅ Customer deleted: ${customer.customer_name}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting customer:", error.message);
    throw new Error("Failed to delete customer.");
  }
};

// Export methods and sync
module.exports = {
  syncCustomerTable,
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
