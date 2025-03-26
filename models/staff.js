const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db'); // Import Sequelize instance

class Staff extends Model {}

// **Define Staff Model**
Staff.init(
  {
    staff_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    staff_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    staff_email: {
      type: DataTypes.STRING,
      allowNull: true, // Optional
      validate: {
        isEmail: true,
      },
    },
    staff_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Staff',
    tableName: 'staffs',
    freezeTableName: true,
    timestamps: false,
  }
);

// **CRUD Methods Using Sequelize**
class StaffService {
  // **Insert a new staff record**
  static async insertStaff(staffData) {
    return await Staff.create(staffData);
  }

  // **Update an existing staff record**
  static async updateStaff(staff_id, staffData) {
    return await Staff.update(staffData, { where: { staff_id } });
  }

  // **Delete a staff record by ID**
  static async deleteStaff(staff_id) {
    return await Staff.destroy({ where: { staff_id } });
  }

  // **Get staff by ID**
  static async getStaffById(staff_id) {
    return await Staff.findByPk(staff_id);
  }

  // **Fetch all staff records**
  static async getAllStaff() {
    return await Staff.findAll();
  }
}

// **Export Model & Service**
module.exports = { Staff, StaffService };
