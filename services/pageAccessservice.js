// ===== PageAccess Service Class (CRUD Operations) =====
class PageAccessService {
    // ✅ Create a new page access record
    static async createPageAccess(pageAccessData) {
      try {
        const pageAccess = await PageAccess.create(pageAccessData);
        console.log("✅ Page access created:", pageAccess);
        return pageAccess;
      } catch (error) {
        throw new Error(`❌ Error creating page access: ${error.message}`);
      }
    }
  
    // ✅ Get page access by ID
    static async getPageAccessById(id) {
      try {
        const pageAccess = await PageAccess.findOne({
          where: { id },
        });
        if (!pageAccess) {
          throw new Error(`❌ No page access found with ID: ${id}`);
        }
        return pageAccess;
      } catch (error) {
        throw new Error(`❌ Error retrieving page access: ${error.message}`);
      }
    }
  
    // ✅ Get all page accesses
    static async getAllPageAccesses() {
      try {
        const pageAccesses = await PageAccess.findAll();
        return pageAccesses;
      } catch (error) {
        throw new Error(`❌ Error retrieving page accesses: ${error.message}`);
      }
    }
  
    // ✅ Update page access by ID
    static async updatePageAccessById(id, updateData) {
      try {
        const [updatedRows] = await PageAccess.update(updateData, {
          where: { id },
        });
        if (updatedRows === 0) {
          throw new Error(`❌ No page access updated with ID: ${id}`);
        }
        console.log("✅ Page access updated with ID:", id);
        return updatedRows;
      } catch (error) {
        throw new Error(`❌ Error updating page access: ${error.message}`);
      }
    }
  
    // ✅ Delete page access by ID
    static async deletePageAccessById(id) {
      try {
        const deletedRows = await PageAccess.destroy({
          where: { id },
        });
        if (deletedRows === 0) {
          throw new Error(`❌ No page access found to delete with ID: ${id}`);
        }
        console.log("✅ Page access deleted with ID:", id);
        return deletedRows;
      } catch (error) {
        throw new Error(`❌ Error deleting page access: ${error.message}`);
      }
    }
  }
  
  // ===== Export Models and Services =====
  module.exports = {
    PageAccess,
    PageAccessService,
    syncDatabase, // Include syncDatabase function for manual synchronization
  };
  