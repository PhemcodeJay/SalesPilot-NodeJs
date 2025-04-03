const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db"); // Import Sequelize instance

// **Define Supplier Model**
class Supplier extends Model {
  // **Create a new supplier**
  static async createSupplier(supplierData) {
    try {
      return await Supplier.create(supplierData);
    } catch (error) {
      console.error("❌ Error creating supplier:", error);
      throw error;
    }
  }

  // **Get a supplier by ID**
  static async getSupplierById(supplier_id) {
    try {
      return await Supplier.findByPk(supplier_id);
    } catch (error) {
      console.error("❌ Error fetching supplier by ID:", error);
      throw error;
    }
  }

  // **Fetch all suppliers**
  static async getAllSuppliers() {
    try {
      return await Supplier.findAll({ order: [["created_at", "DESC"]] });
    } catch (error) {
      console.error("❌ Error fetching all suppliers:", error);
      throw error;
    }
  }

  // **Update a supplier**
  static async updateSupplier(supplier_id, updatedData) {
    try {
      const [updatedRows] = await Supplier.update(updatedData, { where: { supplier_id } });
      return updatedRows > 0; // Return true if at least one row was updated
    } catch (error) {
      console.error("❌ Error updating supplier:", error);
      throw error;
    }
  }

  // **Delete a supplier**
  static async deleteSupplier(supplier_id) {
    try {
      return await Supplier.destroy({ where: { supplier_id } });
    } catch (error) {
      console.error("❌ Error deleting supplier:", error);
      throw error;
    }
  }
}

// **Initialize Supplier Model with Sequelize**
Supplier.init(
  {
    supplier_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplier_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    supplier_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true, // Ensure email is valid
      },
    },
    supplier_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    supplier_location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    supply_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Supplier",
    tableName: "suppliers",
    timestamps: false, // Since `created_at` is manually set, no need for Sequelize's timestamps
  }
);

// **Export Supplier Model**
module.exports = Supplier;
