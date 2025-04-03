const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

// feedback Model Definition
const feedback = sequelize.define(
  "feedback",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Name cannot be empty",
        },
        len: {
          args: [1, 255],
          msg: "Name must be between 1 and 255 characters",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Must be a valid email address",
        },
        notEmpty: {
          msg: "Email cannot be empty",
        },
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Message cannot be empty",
        },
        len: {
          args: [1, 1000],
          msg: "Message must be between 1 and 1000 characters",
        },
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Phone number cannot be empty",
        },
        len: {
          args: [10, 50],
          msg: "Phone number must be between 10 and 50 characters",
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "feedbacks", // The table name is feedbacks in the database
    timestamps: false, // Disable Sequelize's auto timestamps
    underscored: true, // Use snake_case column names
  }
);

// ✅ Sync model with database (Creates table if not exists)
const syncfeedbackTable = async () => {
  try {
    await feedback.sync();
    console.log("✅ feedbacks table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating feedbacks table:", error.message);
    throw new Error("Failed to sync feedbacks table.");
  }
};

// Exporting the feedback model and sync method
module.exports = { feedback, syncfeedbackTable };
