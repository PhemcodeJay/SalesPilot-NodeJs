const { executeQuery } = require("../db");

/**
 * Get total sales revenue over a period.
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<number>} - Total revenue
 */
async function getTotalRevenue(startDate, endDate) {
  const sql = `
    SELECT SUM(total_amount) AS total_revenue 
    FROM sales 
    WHERE order_date BETWEEN ? AND ?
  `;
  const results = await executeQuery(sql, [startDate, endDate]);
  return results[0]?.total_revenue || 0;
}

/**
 * Get top-selling products by quantity.
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} - List of top products
 */
async function getTopSellingProducts(limit = 5) {
  const sql = `
    SELECT p.id, p.product_name, SUM(s.quantity) AS total_sold, SUM(s.total) AS total_sales
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.id, p.product_name
    ORDER BY total_sold DESC
    LIMIT ?
  `;
  return await executeQuery(sql, [limit]);
}

/**
 * Get inventory status for all products.
 * @returns {Promise<Array>} - List of products with stock levels
 */
async function getInventoryStatus() {
  const sql = `
    SELECT p.id, p.product_name, i.stock_qty, i.supply_qty, (i.stock_qty - i.sales_qty) AS available_stock
    FROM inventory i
    JOIN products p ON i.product_id = p.id
  `;
  return await executeQuery(sql);
}

/**
 * Get profit margin by product.
 * @returns {Promise<Array>} - Profit margins per product
 */
async function getProfitMarginByProduct() {
  const sql = `
    SELECT p.id, p.product_name, 
           SUM(s.total) AS total_revenue, 
           SUM(s.quantity * p.cost_price) AS total_cost,
           (SUM(s.total) - SUM(s.quantity * p.cost_price)) AS total_profit,
           ROUND(((SUM(s.total) - SUM(s.quantity * p.cost_price)) / SUM(s.total)) * 100, 2) AS profit_margin
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.id, p.product_name
    ORDER BY profit_margin DESC
  `;
  return await executeQuery(sql);
}

/**
 * Get sales trends over time.
 * @param {string} interval - Time interval: 'daily', 'monthly', 'yearly'
 * @returns {Promise<Array>} - Sales trends data
 */
async function getSalesTrends(interval = "monthly") {
  let dateFormat;
  switch (interval) {
    case "daily":
      dateFormat = "%Y-%m-%d";
      break;
    case "monthly":
      dateFormat = "%Y-%m";
      break;
    case "yearly":
      dateFormat = "%Y";
      break;
    default:
      throw new Error("Invalid interval. Use 'daily', 'monthly', or 'yearly'.");
  }

  const sql = `
    SELECT DATE_FORMAT(order_date, ?) AS period, 
           SUM(total_amount) AS total_sales
    FROM sales
    GROUP BY period
    ORDER BY period ASC
  `;
  return await executeQuery(sql, [dateFormat]);
}

module.exports = {
  getTotalRevenue,
  getTopSellingProducts,
  getInventoryStatus,
  getProfitMarginByProduct,
  getSalesTrends,
};
