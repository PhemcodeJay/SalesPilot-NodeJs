const { Model, DataTypes, Op } = require("sequelize");
const bcryptUtils = require("../utils/bcryptUtils");
const { sequelize } = require("../config/db"); 
const Tenant = require("./Tenant");
const Subscription = require("./subscriptions");

class User extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        username: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        confirm_password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        location: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        role: {
          type: DataTypes.ENUM("sales", "admin", "manager"),
          allowNull: false,
          defaultValue: "sales",
        },
        activation_token: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        activation_token_expiry: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        reset_token: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        reset_token_expiry: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        tenant_id: {
          type: DataTypes.CHAR(36),
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "User",
        tableName: "users",
        timestamps: true, // Ensure timestamps are used
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Tenant, { foreignKey: "tenant_id", as: "tenant" });
    this.hasMany(models.Subscription, { foreignKey: "user_id", as: "subscriptions" });
  }

  /**
   * Hash password before saving.
   */
  async hashPassword() {
    this.password = await bcryptUtils.hashPassword(this.password);
  }
}

module.exports = User;
