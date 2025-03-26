const { Model, DataTypes, Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Import Sequelize instance

// **Define Sale Model Using Sequelize ORM**
class Sale extends Model {}

Sale.init(
  {
    sales_id: {
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
    sale_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Auto-fill sale date
    },
  },
  {
    sequelize,
    modelName: 'Sale',
    tableName: 'sales',
    freezeTableName: true, // Prevent Sequelize from pluralizing table names
    timestamps: false, // Disable timestamps
  }
);

// **Export Sale Model with Custom Queries**
module.exports = {
  Sale,

  // **Create a new sale using Sequelize ORM**
  createSale: async (saleData) => {
    return await Sale.create(saleData);
  },

  // **Get a sale by ID using Sequelize ORM**
  getSaleById: async (sales_id) => {
    return await Sale.findByPk(sales_id);
  },

  // **Get all sales using Sequelize ORM**
  getAllSales: async () => {
    return await Sale.findAll({
      order: [['sale_date', 'DESC']],
    });
  },

  // **Update a sale using Sequelize ORM**
  updateSale: async (sales_id, updatedData) => {
    return await Sale.update(updatedData, { where: { sales_id } });
  },

  // **Delete a sale using Sequelize ORM**
  deleteSale: async (sales_id) => {
    return await Sale.destroy({ where: { sales_id } });
  },

  // **Get sales summary for a date range using Raw SQL**
  getSalesSummary: async (startDate, endDate) => {
    const query = `
      SELECT DATE_FORMAT(sale_date, '%b %y') AS date, SUM(sales_qty) AS total_sales, SUM(sales_price * sales_qty) AS total_revenue
      FROM sales
      WHERE sale_date BETWEEN :startDate AND :endDate
      GROUP BY DATE_FORMAT(sale_date, '%b %y')
      ORDER BY sale_date ASC
    `;
    return await sequelize.query(query, {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT,
    });
  },

  // **Get sales by product using Raw SQL**
  getSalesByProduct: async (startDate, endDate) => {
    const query = `
      SELECT p.name AS product_name, SUM(s.sales_qty) AS total_quantity, SUM(s.sales_price * s.sales_qty) AS total_revenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.sale_date BETWEEN :startDate AND :endDate
      GROUP BY p.name
      ORDER BY total_revenue DESC
    `;
    return await sequelize.query(query, {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT,
    });
  },

  // **Get sales by staff using Raw SQL**
  getSalesByStaff: async (startDate, endDate) => {
    const query = `
      SELECT st.staff_name, SUM(s.sales_qty) AS total_sales, SUM(s.sales_price * s.sales_qty) AS total_revenue
      FROM sales s
      JOIN staffs st ON s.staff_id = st.staff_id
      WHERE s.sale_date BETWEEN :startDate AND :endDate
      GROUP BY st.staff_name
      ORDER BY total_revenue DESC
    `;
    return await sequelize.query(query, {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT,
    });
  },

  // **Get sales by category using Raw SQL**
  getSalesByCategory: async (startDate, endDate) => {
    const query = `
      SELECT c.category_name, SUM(s.sales_qty) AS total_sales, SUM(s.sales_price * s.sales_qty) AS total_revenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN categories c ON p.category_id = c.category_id
      WHERE s.sale_date BETWEEN :startDate AND :endDate
      GROUP BY c.category_name
      ORDER BY total_revenue DESC
    `;
    return await sequelize.query(query, {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT,
    });
  },
};
