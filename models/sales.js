const { Model, DataTypes, Op, QueryTypes } = require("sequelize");
const { sequelize } = require("../config/db"); // Import Sequelize instance

// **Define Sale Model Using Sequelize ORM**
class Sale extends Model {}

Sale.init(
  {
    sales_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    staff_id: { type: DataTypes.INTEGER, allowNull: false },
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    sales_qty: { type: DataTypes.INTEGER, allowNull: false },
    sale_status: { type: DataTypes.STRING, allowNull: false },
    payment_status: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    product_type: {
      type: DataTypes.ENUM("goods", "services", "digital"),
      allowNull: false,
    },
    sale_note: { type: DataTypes.TEXT, allowNull: true },
    sales_price: { type: DataTypes.FLOAT, allowNull: false },
    sale_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: "Sale",
    tableName: "sales",
    freezeTableName: true, // Prevent Sequelize from pluralizing table names
    timestamps: false, // Disable timestamps
  }
);

// **CRUD Operations and Reports**
class SalesService {
  // **Insert a new sale**
  static async createSale(saleData) {
    try {
      return await Sale.create(saleData);
    } catch (error) {
      console.error("❌ Error creating sale:", error);
      throw error;
    }
  }

  // **Get a sale by ID**
  static async getSaleById(sales_id) {
    return await Sale.findByPk(sales_id);
  }

  // **Get all sales**
  static async getAllSales() {
    return await Sale.findAll({ order: [["sale_date", "DESC"]] });
  }

  // **Update a sale**
  static async updateSale(sales_id, updatedData) {
    return await Sale.update(updatedData, { where: { sales_id } });
  }

  // **Delete a sale**
  static async deleteSale(sales_id) {
    return await Sale.destroy({ where: { sales_id } });
  }

  // **Get sales summary for a date range**
  static async getSalesSummary(startDate, endDate) {
    const query = `
      SELECT DATE_FORMAT(sale_date, '%b %y') AS date, 
             SUM(sales_qty) AS total_sales, 
             SUM(sales_price * sales_qty) AS total_revenue
      FROM sales
      WHERE sale_date BETWEEN :startDate AND :endDate
      GROUP BY DATE_FORMAT(sale_date, '%b %y')
      ORDER BY sale_date ASC
    `;
    return await sequelize.query(query, {
      replacements: { startDate, endDate },
      type: QueryTypes.SELECT,
    });
  }

  // **Get sales by product**
  static async getSalesByProduct(startDate, endDate) {
    const query = `
      SELECT p.name AS product_name, 
             SUM(s.sales_qty) AS total_quantity, 
             SUM(s.sales_price * s.sales_qty) AS total_revenue
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
  }

  // **Get sales by staff**
  static async getSalesByStaff(startDate, endDate) {
    const query = `
      SELECT st.staff_name, 
             SUM(s.sales_qty) AS total_sales, 
             SUM(s.sales_price * s.sales_qty) AS total_revenue
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
  }

  // **Get sales by category**
  static async getSalesByCategory(startDate, endDate) {
    const query = `
      SELECT c.category_name, 
             SUM(s.sales_qty) AS total_sales, 
             SUM(s.sales_price * s.sales_qty) AS total_revenue
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
  }
}

// **Export Model & Service**
module.exports = { Sale, SalesService };
