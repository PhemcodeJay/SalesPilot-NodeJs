const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./db');  // Import sequelize instance from db.js

// Define PageAccess Model
class PageAccess extends Model {}

PageAccess.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    page: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Page name cannot be empty" },
      },
    },
    required_access_level: {
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['trial', 'starter', 'business', 'enterprise']],
          msg: "Access level must be one of 'trial', 'starter', 'business', or 'enterprise'",
        },
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at', // matches SQL column
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at', // matches SQL column
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,  // Sequelize instance from db.js
    modelName: 'PageAccess',
    tableName: 'page_access',
    timestamps: true, // Enables createdAt & updatedAt
    underscored: true, // Converts camelCase to snake_case columns
  }
);

// CRUD Operations for PageAccess

// ✅ Create a new page access record
const createPageAccess = async (pageAccessData) => {
  try {
    const pageAccess = await PageAccess.create(pageAccessData);
    console.log("✅ Page access created:", pageAccess);
    return pageAccess;
  } catch (error) {
    console.error("❌ Error creating page access:", error.message);
  }
};

// ✅ Get page access by ID
const getPageAccessById = async (id) => {
  try {
    const pageAccess = await PageAccess.findOne({
      where: { id },
    });
    if (!pageAccess) {
      console.log("❌ No page access found with ID:", id);
    }
    return pageAccess;
  } catch (error) {
    console.error("❌ Error retrieving page access:", error.message);
  }
};

// ✅ Get all page accesses
const getAllPageAccesses = async () => {
  try {
    const pageAccesses = await PageAccess.findAll();
    return pageAccesses;
  } catch (error) {
    console.error("❌ Error retrieving page accesses:", error.message);
  }
};

// ✅ Update page access by ID
const updatePageAccessById = async (id, updateData) => {
  try {
    const [updatedRows] = await PageAccess.update(updateData, {
      where: { id },
    });
    if (updatedRows === 0) {
      console.log("❌ No page access updated with ID:", id);
    } else {
      console.log("✅ Page access updated with ID:", id);
    }
  } catch (error) {
    console.error("❌ Error updating page access:", error.message);
  }
};

// ✅ Delete page access by ID
const deletePageAccessById = async (id) => {
  try {
    const deletedRows = await PageAccess.destroy({
      where: { id },
    });
    if (deletedRows === 0) {
      console.log("❌ No page access found to delete with ID:", id);
    } else {
      console.log("✅ Page access deleted with ID:", id);
    }
  } catch (error) {
    console.error("❌ Error deleting page access:", error.message);
  }
};

// Sync Database (Creates table if it doesn't exist)
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true }); // `alter: true` ensures table updates without data loss
    console.log('✅ PageAccess table synced successfully');
  } catch (error) {
    console.error('❌ Error syncing PageAccess table:', error.message);
  }
}

syncDatabase();

module.exports = {
  PageAccess,
  createPageAccess,
  getPageAccessById,
  getAllPageAccesses,
  updatePageAccessById,
  deletePageAccessById,
  syncDatabase,
};
