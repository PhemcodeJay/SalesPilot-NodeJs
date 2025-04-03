const { Sequelize, DataTypes, Model, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Import Sequelize instance

class Product extends Model {}

// **Define Product Model**
Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Product name is required',
        },
        notEmpty: {
          msg: 'Product name cannot be empty',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Price must be a valid decimal number',
        },
        notNull: {
          msg: 'Price is required',
        },
        min: 0.01, // Prevent 0 or negative prices
      },
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Cost must be a valid decimal number',
        },
        notNull: {
          msg: 'Cost is required',
        },
        min: 0.01, // Prevent 0 or negative costs
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'Category ID must be an integer',
        },
        notNull: {
          msg: 'Category ID is required',
        },
      },
    },
    stock_qty: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    supply_qty: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    image_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    product_type: {
      type: DataTypes.ENUM('goods', 'services', 'digital'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['goods', 'services', 'digital']],
          msg: 'Product type must be one of "goods", "services", or "digital"',
        },
      },
    },
    staff_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    freezeTableName: true,
    timestamps: false,
  }
);

// **Export Product Model with Custom Queries**
module.exports = {
  Product,

  // **Get all products using Sequelize ORM**
  getAllProducts: async () => {
    try {
      return await Product.findAll({ order: [['created_at', 'DESC']] });
    } catch (error) {
      throw new Error(`Error fetching all products: ${error.message}`);
    }
  },

  // **Create or update product using Sequelize ORM**
  createOrUpdateProduct: async (productData) => {
    try {
      const { name, category_id } = productData;
      let product = await Product.findOne({ where: { name, category_id } });

      if (product) {
        await product.update(productData);
        return { message: 'Product updated successfully' };
      } else {
        await Product.create(productData);
        return { message: 'Product added successfully' };
      }
    } catch (error) {
      throw new Error(`Error creating or updating product: ${error.message}`);
    }
  },

  // **Delete a product using Sequelize ORM**
  deleteProduct: async (productId) => {
    try {
      const deleted = await Product.destroy({ where: { id: productId } });
      if (deleted) {
        return { message: 'Product deleted successfully' };
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  },

  // **Get product details by ID using Sequelize ORM**
  getProductById: async (productId) => {
    try {
      const product = await Product.findByPk(productId);
      if (!product) throw new Error('Product not found');
      return product;
    } catch (error) {
      throw new Error(`Error fetching product by ID: ${error.message}`);
    }
  },

  // **Get top-selling products using Raw SQL**
  getTopSellingProducts: async (startDate, endDate) => {
    try {
      const query = `
        SELECT p.id, p.name, p.category, SUM(s.sales_qty) AS total_sold, SUM(s.sales_price * s.sales_qty) AS total_revenue
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date BETWEEN :startDate AND :endDate
        GROUP BY p.id, p.name, p.category
        ORDER BY total_revenue DESC
        LIMIT 10
      `;
      return await sequelize.query(query, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      throw new Error(`Error fetching top-selling products: ${error.message}`);
    }
  },

  // **Get stock status using Raw SQL**
  getStockStatus: async () => {
    try {
      const query = `
        SELECT p.id, p.name, p.category, p.stock_qty, p.supply_qty,
               CASE 
                 WHEN p.stock_qty = 0 THEN 'Out of Stock'
                 WHEN p.stock_qty < 10 THEN 'Low Stock'
                 ELSE 'In Stock'
               END AS stock_status
        FROM products p
        ORDER BY p.stock_qty ASC
      `;
      return await sequelize.query(query, {
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      throw new Error(`Error fetching stock status: ${error.message}`);
    }
  },

  // **Get product sales performance using Raw SQL**
  getProductSalesPerformance: async (startDate, endDate) => {
    try {
      const query = `
        SELECT p.id, p.name, p.category, 
               SUM(s.sales_qty) AS total_quantity, 
               SUM(s.sales_price * s.sales_qty) AS total_revenue,
               (SUM(s.sales_price * s.sales_qty) - SUM(p.cost * s.sales_qty)) AS total_profit
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date BETWEEN :startDate AND :endDate
        GROUP BY p.id, p.name, p.category
        ORDER BY total_profit DESC
      `;
      return await sequelize.query(query, {
        replacements: { startDate, endDate },
        type: QueryTypes.SELECT,
      });
    } catch (error) {
      throw new Error(`Error fetching product sales performance: ${error.message}`);
    }
  },
};
