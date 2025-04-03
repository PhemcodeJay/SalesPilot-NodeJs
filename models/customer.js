const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

// Customer Model Definition
const Customer = sequelize.define(
  "Customer",
  {
    customer_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Customer name cannot be empty",
        },
        len: {
          args: [1, 100],
          msg: "Customer name must be between 1 and 100 characters",
        },
      },
    },
    customer_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Must be a valid email address",
        },
        notEmpty: {
          msg: "Email cannot be empty",
        },
      },
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Phone number cannot be empty",
        },
        len: {
          args: [10, 20],
          msg: "Phone number must be between 10 and 20 characters",
        },
      },
    },
    customer_location: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Location cannot be empty",
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "customers",
    timestamps: false, // Disable Sequelize's auto timestamps
    underscored: true, // Use snake_case column names
  }
);

// ✅ Sync model with database (Creates table if not exists)
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
const getAllCustomers = async () => {
  try {
    return await Customer.findAll();
  } catch (error) {
    console.error("❌ Error fetching customers:", error.message);
    throw new Error("Failed to fetch customers.");
  }
};

const getCustomerById = async (customerId) => {
  try {
    return await Customer.findOne({ where: { customer_id: customerId } });
  } catch (error) {
    console.error("❌ Error fetching customer by ID:", error.message);
    throw new Error("Failed to fetch customer by ID.");
  }
};

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

// Exporting methods and sync
module.exports = { 
  Customer, 
  syncCustomerTable,
  getAllCustomers, 
  getCustomerById,
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
};
