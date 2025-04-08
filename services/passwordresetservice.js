// ===== PasswordReset Service Class (CRUD Operations) =====
class PasswordResetService {
    // ✅ Create a new password reset record
    static async createPasswordReset(resetData) {
      try {
        const passwordReset = await PasswordReset.create(resetData);
        console.log("✅ Password reset created:", passwordReset);
        return passwordReset;
      } catch (error) {
        throw new Error(`❌ Error creating password reset: ${error.message}`);
      }
    }
  
    // ✅ Get password reset by ID
    static async getPasswordResetById(id) {
      try {
        const passwordReset = await PasswordReset.findOne({
          where: { id },
        });
        if (!passwordReset) {
          throw new Error(`❌ No password reset found with ID: ${id}`);
        }
        return passwordReset;
      } catch (error) {
        throw new Error(`❌ Error retrieving password reset: ${error.message}`);
      }
    }
  
    // ✅ Get all password reset records for a user
    static async getPasswordResetsByUserId(userId) {
      try {
        const passwordResets = await PasswordReset.findAll({
          where: { user_id: userId },
        });
        return passwordResets;
      } catch (error) {
        throw new Error(`❌ Error retrieving password resets for user ${userId}: ${error.message}`);
      }
    }
  
    // ✅ Update password reset record by ID
    static async updatePasswordResetById(id, updateData) {
      try {
        const [updatedRows] = await PasswordReset.update(updateData, {
          where: { id },
        });
        if (updatedRows === 0) {
          throw new Error(`❌ No password reset updated with ID: ${id}`);
        }
        console.log("✅ Password reset updated with ID:", id);
        return updatedRows;
      } catch (error) {
        throw new Error(`❌ Error updating password reset: ${error.message}`);
      }
    }
  
    // ✅ Delete password reset by ID
    static async deletePasswordResetById(id) {
      try {
        const deletedRows = await PasswordReset.destroy({
          where: { id },
        });
        if (deletedRows === 0) {
          throw new Error(`❌ No password reset found to delete with ID: ${id}`);
        }
        console.log("✅ Password reset deleted with ID:", id);
        return deletedRows;
      } catch (error) {
        throw new Error(`❌ Error deleting password reset: ${error.message}`);
      }
    }
  }
  
  // ===== Export Models and Services =====
  module.exports = {
    PasswordReset,
    PasswordResetService,
    syncDatabase, // Include syncDatabase function for manual synchronization
  };
  