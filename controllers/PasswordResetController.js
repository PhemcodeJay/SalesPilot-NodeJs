const { PasswordReset } = require("../models");

class PasswordResetController {
  // ✅ Create Password Reset Table (Handled by Sequelize Migration)
  static async createPasswordResetsTable() {
    try {
      await PasswordReset.sync(); // Ensure the table exists
      console.log("✅ Password Resets table is ready.");
    } catch (error) {
      console.error("❌ Error creating table:", error.message);
    }
  }

  // ✅ Create Password Reset Record
  static async createPasswordResetRecord(req, res) {
    try {
      const { user_id, reset_code, expires_at } = req.body;
      const newRecord = await PasswordReset.create({ user_id, reset_code, expires_at });
      res.status(201).json({ message: "Password reset record created", id: newRecord.id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Get Password Reset by ID
  static async getPasswordResetById(req, res) {
    try {
      const record = await PasswordReset.findByPk(req.params.id);
      if (!record) return res.status(404).json({ message: "Record not found" });
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Get Latest Password Reset by User ID
  static async getPasswordResetByUserId(req, res) {
    try {
      const record = await PasswordReset.findOne({
        where: { user_id: req.params.user_id },
        order: [["created_at", "DESC"]],
      });
      if (!record) return res.status(404).json({ message: "Record not found" });
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Update Password Reset Record
  static async updatePasswordReset(req, res) {
    try {
      const { reset_code, expires_at } = req.body;
      const updated = await PasswordReset.update({ reset_code, expires_at }, { where: { id: req.params.id } });
      if (!updated[0]) return res.status(404).json({ message: "Record not found" });
      res.json({ message: "Password reset updated" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Delete Password Reset Record
  static async deletePasswordReset(req, res) {
    try {
      const deleted = await PasswordReset.destroy({ where: { id: req.params.id } });
      if (!deleted) return res.status(404).json({ message: "Record not found" });
      res.json({ message: "Password reset deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PasswordResetController;
