const Tenant = require('../models/Tenant'); // Ensure the correct path to the model

const tenantService = {
  /**
   * Fetch all tenants from the database.
   * @returns {Promise<Array>} List of all tenants.
   */
  async getAllTenants() {
    try {
      const tenants = await Tenant.findAll();
      console.log(`Fetched ${tenants.length} tenants.`);
      return tenants;
    } catch (error) {
      console.error('❌ Error fetching tenants:', error.message);
      throw new Error('Failed to retrieve tenants');
    }
  },

  /**
   * Get a tenant by its ID.
   * @param {number} tenantId - The ID of the tenant.
   * @returns {Promise<Object|null>} The tenant object or null if not found.
   */
  async getTenantById(tenantId) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        console.warn(`⚠️ Tenant with ID ${tenantId} not found.`);
        return null;
      }
      return tenant;
    } catch (error) {
      console.error(`❌ Error fetching tenant with ID ${tenantId}:`, error.message);
      throw new Error('Failed to retrieve tenant');
    }
  },

  /**
   * Create a new tenant in the database.
   * @param {Object} data - The tenant data to be created.
   * @returns {Promise<Object>} The created tenant object.
   */
  async createTenant(data) {
    try {
      const newTenant = await Tenant.create(data);
      console.log(`✅ Tenant created: ${newTenant.id}`);
      return newTenant;
    } catch (error) {
      console.error('❌ Error creating tenant:', error.message);
      throw new Error('Failed to create tenant');
    }
  },

  /**
   * Update an existing tenant's details.
   * @param {number} tenantId - The ID of the tenant to update.
   * @param {Object} updateData - The data to update.
   * @returns {Promise<Object|null>} The updated tenant object or null if not found.
   */
  async updateTenant(tenantId, updateData) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        console.warn(`⚠️ Tenant with ID ${tenantId} not found.`);
        return null;
      }
      await tenant.update(updateData);
      console.log(`✅ Tenant updated: ${tenant.id}`);
      return tenant;
    } catch (error) {
      console.error(`❌ Error updating tenant ${tenantId}:`, error.message);
      throw new Error('Failed to update tenant');
    }
  },

  /**
   * Delete a tenant from the database.
   * @param {number} tenantId - The ID of the tenant to delete.
   * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
   */
  async deleteTenant(tenantId) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        console.warn(`⚠️ Tenant with ID ${tenantId} not found.`);
        return false;
      }
      await tenant.destroy();
      console.log(`🗑️ Tenant deleted: ${tenant.id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting tenant ${tenantId}:`, error.message);
      throw new Error('Failed to delete tenant');
    }
  }
};

module.exports = tenantService;
