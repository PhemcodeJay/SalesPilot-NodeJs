module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define(
    "Staff",
    {
      staff_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      staff_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      staff_email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: { isEmail: true },
      },
      staff_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      position: {
        type: DataTypes.ENUM("manager", "sales"),
        allowNull: false,
        defaultValue: "sales",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "staffs",
      freezeTableName: true,
      timestamps: false, // created_at is managed manually
    }
  );

  // Optional: add associations here
  Staff.associate = (models) => {
    // Example: Staff.belongsTo(models.Tenant, { foreignKey: "tenant_id" });
  };

  return Staff;
};
