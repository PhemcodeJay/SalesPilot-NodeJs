const { Model, DataTypes, Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ===== Define RevenueByProduct Model =====
class RevenueByProduct extends Model {}

RevenueByProduct.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  report_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reports',
      key: 'report_id',
    },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  total_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_sales: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  total_cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  total_profit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  inventory_turnover_rate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
  },
  sell_through_rate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'RevenueByProduct',
  tableName: 'revenue_by_product',
  freezeTableName: true,
  timestamps: false,
});

// ===== Define Report Model =====
class Report extends Model {}

Report.init({
  report_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  report_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  revenue_by_product: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  sell_through_rate: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  inventory_turnover_rate: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Report',
  tableName: 'reports',
  freezeTableName: true,
  timestamps: false,
});

// ===== Exported Functions =====
module.exports = {
  Report,
  RevenueByProduct,

  // Create a report
  createReport: async (date, revenue_by_product) => {
    try {
      return await Report.create({ report_date: date, revenue_by_product });
    } catch (error) {
      throw new Error(`Error creating report: ${error.message}`);
    }
  },

  // Get report by ID
  getReportById: async (report_id) => {
    try {
      const report = await Report.findByPk(report_id);
      if (!report) throw new Error('Report not found');
      return report;
    } catch (error) {
      throw new Error(`Error fetching report: ${error.message}`);
    }
  },

  // Get all reports
  getAllReports: async () => {
    try {
      return await Report.findAll({ order: [['report_date', 'DESC']] });
    } catch (error) {
      throw new Error(`Error fetching reports: ${error.message}`);
    }
  },

  // Update report
  updateReport: async (report_id, date, revenue_by_product) => {
    try {
      const [updated] = await Report.update(
        { report_date: date, revenue_by_product },
        { where: { report_id } }
      );
      if (!updated) throw new Error('Report not found or not updated');
      return { message: 'Report updated successfully' };
    } catch (error) {
      throw new Error(`Error updating report: ${error.message}`);
    }
  },

  // Delete report
  deleteReport: async (report_id) => {
    try {
      const deleted = await Report.destroy({ where: { report_id } });
      if (!deleted) throw new Error('Report not found');
      return { message: 'Report deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting report: ${error.message}`);
    }
  },

  // Get sales data for chart
  getSalesData: async (startDate, endDate) => {
    try {
      const query = `
        SELECT DATE_FORMAT(sale_date, '%b %y') AS date, SUM(sales_qty) AS total_sales
        FROM sales
        WHERE sale_date BETWEEN :startDate AND :endDate
        GROUP BY DATE_FORMAT(sale_date, '%b %y')
        ORDER BY sale_date ASC
      `;
      return await sequelize.query(query, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      throw new Error(`Error fetching sales data: ${error.message}`);
    }
  },

  // Get revenue by product for reporting
  getRevenueByProductData: async (startDate, endDate) => {
    try {
      return await RevenueByProduct.findAll({
        attributes: [
          'report_id', 'product_id', 'product_name',
          'total_quantity', 'total_sales', 'total_cost',
          'total_profit', 'inventory_turnover_rate', 'sell_through_rate'
        ],
        include: [{
          model: Report,
          where: { report_date: { [Op.between]: [startDate, endDate] } },
        }],
        order: [['product_name', 'ASC']],
      });
    } catch (error) {
      throw new Error(`Error fetching revenue by product: ${error.message}`);
    }
  },

  // Get total revenue data
  getRevenueData: async (startDate, endDate) => {
    try {
      const query = `
        SELECT DATE_FORMAT(sale_date, '%b %y') AS date, SUM(sales_qty * price) AS revenue
        FROM sales
        JOIN products ON sales.product_id = products.id
        WHERE sale_date BETWEEN :startDate AND :endDate
        GROUP BY DATE_FORMAT(sale_date, '%b %y')
        ORDER BY sale_date ASC
      `;
      return await sequelize.query(query, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      throw new Error(`Error fetching revenue data: ${error.message}`);
    }
  },

  // Get total cost data
  getTotalCostData: async (startDate, endDate) => {
    try {
      const query = `
        SELECT DATE_FORMAT(sale_date, '%b %y') AS date, SUM(sales_qty * cost) AS total_cost
        FROM sales
        JOIN products ON sales.product_id = products.id
        WHERE sale_date BETWEEN :startDate AND :endDate
        GROUP BY DATE_FORMAT(sale_date, '%b %y')
        ORDER BY sale_date ASC
      `;
      return await sequelize.query(query, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      throw new Error(`Error fetching total cost data: ${error.message}`);
    }
  },

  // Get expenses over time
  getExpenseData: async (startDate, endDate) => {
    try {
      const query = `
        SELECT DATE_FORMAT(expense_date, '%b %y') AS date, SUM(amount) AS total_expenses
        FROM expenses
        WHERE expense_date BETWEEN :startDate AND :endDate
        GROUP BY DATE_FORMAT(expense_date, '%b %y')
        ORDER BY expense_date ASC
      `;
      return await sequelize.query(query, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      throw new Error(`Error fetching expense data: ${error.message}`);
    }
  },
};
