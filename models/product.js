module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
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
          notNull: { msg: "Product name is required" },
          notEmpty: { msg: "Product name cannot be empty" },
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
          isDecimal: { msg: "Price must be a valid decimal number" },
          notNull: { msg: "Price is required" },
          min: 0.01,
        },
      },
      cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: "Cost must be a valid decimal number" },
          notNull: { msg: "Cost is required" },
          min: 0.01,
        },
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: "Category ID must be an integer" },
          notNull: { msg: "Category ID is required" },
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
        type: DataTypes.ENUM("goods", "services", "digital"),
        allowNull: false,
        validate: {
          isIn: {
            args: [["goods", "services", "digital"]],
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
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "products",
      freezeTableName: true,
      timestamps: false,
    }
  );

  Product.associate = (models) => {
    // Example association
    // Product.belongsTo(models.Category, { foreignKey: 'category_id' });
  };

  return Product;
};
