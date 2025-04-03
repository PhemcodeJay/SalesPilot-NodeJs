const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db.js'); // Adjust path to match your setup

// Define PasswordReset Model
class PasswordReset extends Model {}

PasswordReset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: "User ID must be an integer",
        },
        notNull: {
          msg: "User ID is required",
        },
      },
    },
    reset_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Reset code cannot be empty",
        },
        len: {
          args: [6, 100], // Reset code must be at least 6 characters
          msg: "Reset code must be at least 6 characters long",
        },
      },
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: "Expiration date must be a valid date",
        },
        notNull: {
          msg: "Expiration date is required",
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    sequelize,
    modelName: 'PasswordReset',
    tableName: 'password_resets',
    timestamps: false,
    underscored: true, // Uses snake_case for column names
  }
);

// CRUD Operations for PasswordReset

// ✅ Create a new password reset record
const createPasswordReset = async (resetData) => {
  try {
    const passwordReset = await PasswordReset.create(resetData);
    console.log("✅ Password reset created:", passwordReset);
    return passwordReset;
  } catch (error) {
    console.error("❌ Error creating password reset:", error.message);
  }
};

// ✅ Get password reset by ID
const getPasswordResetById = async (id) => {
  try {
    const passwordReset = await PasswordReset.findOne({
      where: { id },
    });
    if (!passwordReset) {
      console.log("❌ No password reset found with ID:", id);
    }
    return passwordReset;
  } catch (error) {
    console.error("❌ Error retrieving password reset:", error.message);
  }
};

// ✅ Get all password reset records for a user
const getPasswordResetsByUserId = async (userId) => {
  try {
    const passwordResets = await PasswordReset.findAll({
      where: { user_id: userId },
    });
    return passwordResets;
  } catch (error) {
    console.error("❌ Error retrieving password resets:", error.message);
  }
};

// ✅ Update password reset record by ID
const updatePasswordResetById = async (id, updateData) => {
  try {
    const [updatedRows] = await PasswordReset.update(updateData, {
      where: { id },
    });
    if (updatedRows === 0) {
      console.log("❌ No password reset updated with ID:", id);
    } else {
      console.log("✅ Password reset updated with ID:", id);
    }
  } catch (error) {
    console.error("❌ Error updating password reset:", error.message);
  }
};

// ✅ Delete password reset by ID
const deletePasswordResetById = async (id) => {
  try {
    const deletedRows = await PasswordReset.destroy({
      where: { id },
    });
    if (deletedRows === 0) {
      console.log("❌ No password reset found to delete with ID:", id);
    } else {
      console.log("✅ Password reset deleted with ID:", id);
    }
  } catch (error) {
    console.error("❌ Error deleting password reset:", error.message);
  }
};

// Sync Database (Creates table if it doesn't exist)
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true }); // `alter: true` ensures table updates without data loss
    console.log('✅ PasswordReset table synced successfully');
  } catch (error) {
    console.error('❌ Error syncing PasswordReset table:', error.message);
  }
}

syncDatabase();

module.exports = {
  PasswordReset,
  createPasswordReset,
  getPasswordResetById,
  getPasswordResetsByUserId,
  updatePasswordResetById,
  deletePasswordResetById,
  syncDatabase,
};
