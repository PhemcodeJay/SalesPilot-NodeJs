const PageAccess = require('../models/pageAccess'); // Import the model

class PageAccessController {
  // Create a new record
  static async createPageAccessRecord(pageData) {
    try {
      const record = await PageAccess.create(pageData);
      return record;
    } catch (error) {
      throw new Error(`Error creating page access record: ${error.message}`);
    }
  }

  // Get a record by ID
  static async getPageAccessById(id) {
    try {
      const record = await PageAccess.findByPk(id);
      if (!record) throw new Error('Page access record not found.');
      return record;
    } catch (error) {
      throw new Error(`Error fetching page access: ${error.message}`);
    }
  }

  // Get all records
  static async getAllPageAccessRecords() {
    try {
      return await PageAccess.findAll({ order: [['createdAt', 'DESC']] });
    } catch (error) {
      throw new Error(`Error fetching all page access records: ${error.message}`);
    }
  }

  // Update a record
  static async updatePageAccess(id, updatedData) {
    try {
      const record = await PageAccess.findByPk(id);
      if (!record) throw new Error('Page access record not found.');

      await record.update(updatedData);
      return record;
    } catch (error) {
      throw new Error(`Error updating page access record: ${error.message}`);
    }
  }

  // Delete a record
  static async deletePageAccess(id) {
    try {
      const result = await PageAccess.destroy({ where: { id } });
      return result > 0; // Returns true if deleted, false otherwise
    } catch (error) {
      throw new Error(`Error deleting page access record: ${error.message}`);
    }
  }
}

module.exports = PageAccessController;
