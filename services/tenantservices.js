const Tenant = require('../models/tenant'); // Ensure correct path and casing

const tenantService = {
  /**
   * Fetch all tenants from the database.
   * @returns {Promise<Array>} List of all tenants.
   */
  async getAllTenants() {
    try {
      const tenants = await Tenant.findAll();
      console.log(`✅ Retrieved ${tenants.length} tenants.`);
      return tenants;
    } catch (error) {
      console.error(`❌ Error fetching tenants: ${error.message}\nStack: ${error.stack}`);
      throw new Error('Failed to retrieve tenants.');
    }
  },

  /**
   * Get a tenant by its ID.
   * @param {string} tenantId - The UUID of the tenant.
   * @returns {Promise<Tenant|null>} The tenant object or null if not found.
   */
  async getTenantById(tenantId) {
    try {
      if (!tenantId || typeof tenantId !== 'string') {
        throw new Error('Invalid tenant ID format');
      }

      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        console.warn(`⚠️ Tenant with ID ${tenantId} not found.`);
        return null;
      }
      return tenant;
    } catch (error) {
      console.error(`❌ Error fetching tenant by ID: ${error.message}\nStack: ${error.stack}`);
      throw new Error('Failed to retrieve tenant.');
    }
  },

  /**
   * Get a tenant by email.
   * @param {string} email - The email of the tenant.
   * @returns {Promise<Tenant|null>} The tenant object or null if not found.
   */
  async getTenantByEmail(email) {
    try {
      if (!email || typeof email !== 'string') {
        throw new Error('Valid email is required');
      }

      const tenant = await Tenant.findOne({ where: { email } });
      if (!tenant) {
        console.warn(`⚠️ No tenant found with email: ${email}`);
        return null;
      }
      return tenant;
    } catch (error) {
      console.error(`❌ Error fetching tenant by email: ${error.message}\nStack: ${error.stack}`);
      throw new Error('Failed to retrieve tenant.');
    }
  },

  /**
   * Create a new tenant in the database.
   * @param {Object} data - The tenant data to be created.
   * @returns {Promise<Tenant>} The created tenant object.
   */
  async createTenant(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid tenant data');
      }

      const newTenant = await Tenant.create(data);
      console.log(`✅ Tenant created: ${newTenant.id}`);
      return newTenant;
    } catch (error) {
      console.error(`❌ Error creating tenant: ${error.message}\nStack: ${error.stack}`);
      throw new Error('Failed to create tenant.');
    }
  },

  /**
   * Update an existing tenant's details.
   * @param {string} tenantId - The UUID of the tenant to update.
   * @param {Object} updateData - The data to update.
   * @returns {Promise<Tenant|null>} The updated tenant object or null if not found.
   */
  async updateTenant(tenantId, updateData) {
    try {
      if (!tenantId || typeof tenantId !== 'string') {
        throw new Error('Invalid tenant ID format');
      }
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Invalid update data');
      }

      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        console.warn(`⚠️ Tenant with ID ${tenantId} not found.`);
        return null;
      }

      await tenant.update(updateData);
      console.log(`✅ Tenant updated: ${tenant.id}`);
      return tenant;
    } catch (error) {
      console.error(`❌ Error updating tenant ${tenantId}: ${error.message}\nStack: ${error.stack}`);
      throw new Error('Failed to update tenant.');
    }
  },

  /**
   * Delete a tenant from the database.
   * @param {string} tenantId - The UUID of the tenant to delete.
   * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
   */
  async deleteTenant(tenantId) {
    try {
      if (!tenantId || typeof tenantId !== 'string') {
        throw new Error('Invalid tenant ID format');
      }

      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        console.warn(`⚠️ Tenant with ID ${tenantId} not found.`);
        return false;
      }

      await tenant.destroy();
      console.log(`🗑️ Tenant deleted: ${tenant.id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting tenant ${tenantId}: ${error.message}\nStack: ${error.stack}`);
      throw new Error('Failed to delete tenant.');
    }
  },
};

module.exports = tenantService;
