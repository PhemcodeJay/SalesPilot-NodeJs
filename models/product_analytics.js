const { Model, DataTypes, Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Import Sequelize instance

// **Define RevenueByProduct Model Using Sequelize ORM**
class RevenueByProduct extends Model {}

RevenueByProduct.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    report_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product_analytics',
        key: 'reports_id',
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
  },
  {
    sequelize,
    modelName: 'RevenueByProduct',
    tableName: 'revenue_by_product',
    freezeTableName: true, // Prevent Sequelize from pluralizing table names
    timestamps: false, // Disable timestamps
  }
);

// **Define Report Model Using Sequelize ORM**
class Report extends Model {}

Report.init(
  {
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
      type: DataTypes.JSON, // ✅ Storing JSON data
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
  },
  {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    freezeTableName: true, // Prevent Sequelize from pluralizing table names
    timestamps: false, // Disable timestamps
  }
);

// **Export Report and RevenueByProduct Models**
module.exports = {
  Report,
  RevenueByProduct,

  // **Create a new report using Sequelize ORM**
  createReport: async (date, revenue_by_product) => {
    return await Report.create({
      report_date: date,
      revenue_by_product,
    });
  },

  // **Get a report by ID using Sequelize ORM**
  getReportById: async (report_id) => {
    return await Report.findByPk(report_id);
  },

  // **Get all reports using Sequelize ORM**
  getAllReports: async () => {
    return await Report.findAll({
      order: [['report_date', 'DESC']],
    });
  },

  // **Update a report using Sequelize ORM**
  updateReport: async (report_id, date, revenue_by_product) => {
    return await Report.update(
      { report_date: date, revenue_by_product },
      { where: { report_id } }
    );
  },

  // **Delete a report using Sequelize ORM**
  deleteReport: async (report_id) => {
    return await Report.destroy({ where: { report_id } });
  },

  // **Get sales data for charts using Raw SQL**
  getSalesData: async (startDate, endDate) => {
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
  },

  // **Get revenue by product data using Sequelize ORM**
  getRevenueByProductData: async (startDate, endDate) => {
    return await RevenueByProduct.findAll({
      attributes: ['report_id', 'product_id', 'product_name', 'total_quantity', 'total_sales', 'total_cost', 'total_profit', 'inventory_turnover_rate', 'sell_through_rate'],
      include: [
        {
          model: Report,
          where: {
            report_date: { [Op.between]: [startDate, endDate] },
          },
        },
      ],
      order: [['product_name', 'ASC']],
    });
  },

  // **Get revenue data using Raw SQL**
  getRevenueData: async (startDate, endDate) => {
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
  },

  // **Get total cost data using Raw SQL**
  getTotalCostData: async (startDate, endDate) => {
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
  },

  // **Get expense data for charts using Raw SQL**
  getExpenseData: async (startDate, endDate) => {
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
  },
};
