const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

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
    },
    customer_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    customer_location: {
      type: DataTypes.TEXT,
      allowNull: false,
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
  }
};

module.exports = { Customer, syncCustomerTable };
