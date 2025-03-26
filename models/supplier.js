const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db'); // Import Sequelize instance

class Supplier extends Model {
  // **Create a new supplier**
  static async createSupplier(supplierData) {
    return await Supplier.create(supplierData);
  }

  // **Get a supplier by ID**
  static async getSupplierById(supplier_id) {
    return await Supplier.findByPk(supplier_id);
  }

  // **Fetch all suppliers**
  static async getAllSuppliers() {
    return await Supplier.findAll({ order: [['createdAt', 'DESC']] });
  }

  // **Update a supplier**
  static async updateSupplier(supplier_id, updatedData) {
    return await Supplier.update(updatedData, { where: { supplier_id } });
  }

  // **Delete a supplier**
  static async deleteSupplier(supplier_id) {
    return await Supplier.destroy({ where: { supplier_id } });
  }
}

// **Define Supplier Model**
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
        isEmail: true,
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
  },
  {
    sequelize,
    modelName: 'Supplier',
    tableName: 'suppliers',
    timestamps: true, // ✅ Includes createdAt & updatedAt
  }
);

// **Export Model**
module.exports = Supplier;
