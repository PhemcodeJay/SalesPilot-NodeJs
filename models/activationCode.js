const { DataTypes, Model, Op } = require("sequelize");
const { sequelize } = require("../config/db"); // Centralized DB connection
const User = require("./User");

class ActivationCode extends Model {
  /**
   * Define model associations
   * @param {object} models - Sequelize models
   */
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  }

  /**
   * Generate and save a new activation code
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Activation code details
   */
  static async generateActivationCode(userId) {
    try {
      const activationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiry

      const newCode = await ActivationCode.create({
        user_id: userId,
        activation_code: activationCode,
        expires_at: expiresAt,
      });

      return { success: true, activationCode };
    } catch (error) {
      console.error("Activation Code Generation Error:", error.message);
      throw new Error("Failed to generate activation code.");
    }
  }

  /**
   * Verify activation code
   * @param {string} userId - User ID
   * @param {string} code - Activation code
   * @returns {Promise<object>}
   */
  static async verifyActivationCode(userId, code) {
    try {
      const activationRecord = await ActivationCode.findOne({
        where: {
          user_id: userId,
          activation_code: code,
          expires_at: { [Op.gt]: new Date() }, // Ensure it's not expired
        },
      });

      if (!activationRecord) {
        throw new Error("Invalid or expired activation code.");
      }

      // Mark user as active
      await User.update({ is_active: true }, { where: { id: userId } });

      // Remove activation code after successful verification
      await activationRecord.destroy();

      return { success: true, message: "Account activated successfully." };
    } catch (error) {
      console.error("Activation Code Verification Error:", error.message);
      throw new Error("Failed to verify activation code.");
    }
  }

  /**
   * Delete expired activation codes
   */
  static async deleteExpiredCodes() {
    try {
      const deletedCount = await ActivationCode.destroy({
        where: { expires_at: { [Op.lt]: new Date() } },
      });

      return { success: true, deletedCount };
    } catch (error) {
      console.error("Expired Activation Code Deletion Error:", error.message);
      throw new Error("Failed to delete expired activation codes.");
    }
  }
}

// Model Initialization
ActivationCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID, // Updated to match `User.id` (UUID)
      allowNull: false,
      references: {
        model: "users", // Match the table name of the associated model
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    activation_code: {
      type: DataTypes.STRING(6), // Standardizing to a 6-digit code
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize, // Ensure the sequelize instance is passed here
    modelName: "ActivationCode", // Specify model name
    tableName: "activation_codes", // Define table name
    timestamps: true, // Enable createdAt & updatedAt
    underscored: true, // Maps camelCase fields to snake_case DB columns
  }
);

// This will ensure that the model is loaded correctly and associations are set
ActivationCode.associate({ User });

module.exports = ActivationCode;
