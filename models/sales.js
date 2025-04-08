module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define(
    "Sale",
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
      tableName: "sales",
      freezeTableName: true,
      timestamps: false,
    }
  );

  Sale.associate = (models) => {
    // Optional: define associations here
    // Example:
    // Sale.belongsTo(models.Product, { foreignKey: "product_id" });
    // Sale.belongsTo(models.Staff, { foreignKey: "staff_id" });
    // Sale.belongsTo(models.Customer, { foreignKey: "customer_id" });
  };

  return Sale;
};
