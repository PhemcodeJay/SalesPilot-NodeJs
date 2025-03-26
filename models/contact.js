const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import Sequelize instance

const Contact = sequelize.define(
  "Contact",
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
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "contacts",
    timestamps: false, // Disable Sequelize's auto timestamps
    underscored: true, // Use snake_case column names
  }
);

// ✅ Sync model with database (Creates table if not exists)
const syncContactTable = async () => {
  try {
    await Contact.sync();
    console.log("✅ Contacts table created or already exists.");
  } catch (error) {
    console.error("❌ Error creating Contacts table:", error.message);
  }
};

module.exports = { Contact, syncContactTable };
