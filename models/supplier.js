module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define(
    "Supplier",
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "suppliers",
      timestamps: false, // We manually handle created_at
    }
  );

  // Optional: if you ever need associations
  Supplier.associate = (models) => {
    // e.g., Supplier.hasMany(models.Product) if needed
  };

  return Supplier;
};
