const { Model } = require('sequelize');
const { sequelize, DataTypes } = require('../config/db'); // Import from db.js

class Sale extends Model {}

Sale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sales_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sale_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_type: {
      type: DataTypes.ENUM('goods', 'services', 'digital'),
      allowNull: false,
    },
    sale_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sales_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize, // ✅ Use the imported Sequelize instance
    modelName: 'Sale',
    tableName: 'sales',
    freezeTableName: true, // ✅ Prevent Sequelize from pluralizing table names
    timestamps: false, // ✅ Disable timestamps
  }
);

module.exports = Sale;
