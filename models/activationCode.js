const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db"); // Use centralized DB connection

class ActivationCode extends Model {
  /**
   * Define model associations
   * @param {object} models - Sequelize models
   */
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  }
}

ActivationCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    activation_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ActivationCode",
    tableName: "activation_codes",
    timestamps: true, // Enables createdAt & updatedAt
    underscored: true, // Maps camelCase fields to snake_case DB columns
  }
);

module.exports = ActivationCode;
