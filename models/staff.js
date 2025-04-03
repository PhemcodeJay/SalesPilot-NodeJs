const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db"); // Import Sequelize instance

// **Define Staff Model**
class Staff extends Model {
  // **Insert a new staff record**
  static async insertStaff(staffData) {
    try {
      return await Staff.create(staffData);
    } catch (error) {
      console.error("❌ Error inserting staff:", error);
      throw error;
    }
  }

  // **Update an existing staff record**
  static async updateStaff(staff_id, staffData) {
    try {
      const [updatedRows] = await Staff.update(staffData, { where: { staff_id } });
      return updatedRows > 0; // Returns true if at least one row was updated
    } catch (error) {
      console.error("❌ Error updating staff:", error);
      throw error;
    }
  }

  // **Delete a staff record by ID**
  static async deleteStaff(staff_id) {
    try {
      return await Staff.destroy({ where: { staff_id } });
    } catch (error) {
      console.error("❌ Error deleting staff:", error);
      throw error;
    }
  }

  // **Get staff by ID**
  static async getStaffById(staff_id) {
    try {
      return await Staff.findByPk(staff_id);
    } catch (error) {
      console.error("❌ Error fetching staff by ID:", error);
      throw error;
    }
  }

  // **Fetch all staff records**
  static async getAllStaff() {
    try {
      return await Staff.findAll({ order: [["created_at", "DESC"]] });
    } catch (error) {
      console.error("❌ Error fetching all staff:", error);
      throw error;
    }
  }
}

// **Initialize Staff Model with Sequelize**
Staff.init(
  {
    staff_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    staff_name: { type: DataTypes.STRING(100), allowNull: false },
    staff_email: { type: DataTypes.STRING(100), allowNull: true, validate: { isEmail: true } },
    staff_phone: { type: DataTypes.STRING(20), allowNull: true },
    position: {
      type: DataTypes.ENUM("manager", "sales"),
      allowNull: false,
      defaultValue: "sales",
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: "Staff",
    tableName: "staffs",
    freezeTableName: true, // Prevents Sequelize from pluralizing the table name
    timestamps: false, // Disables automatic timestamps
  }
);

// **Test CRUD Operations (Auto-Execute for Debugging)**
(async function manageStaff() {
  try {
    // **Insert a new staff**
    const newStaff = await Staff.insertStaff({
      staff_name: "John Doe",
      staff_email: "johndoe@example.com",
      staff_phone: "1234567890",
      position: "manager",
    });
    console.log("✅ New staff added:", newStaff.toJSON());

    // **Fetch all staff records**
    const allStaff = await Staff.getAllStaff();
    console.log("✅ All staff records:", allStaff.map((s) => s.toJSON()));

    // **Update staff record**
    const updated = await Staff.updateStaff(newStaff.staff_id, { position: "sales" });
    console.log("✅ Staff updated:", updated);

    // **Delete a staff record**
    const deleted = await Staff.deleteStaff(newStaff.staff_id);
    console.log("✅ Staff deleted:", deleted);
  } catch (error) {
    console.error("❌ Error in staff management:", error);
  }
})();
