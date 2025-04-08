const { ActivationCode } = require('../models'); // Sequelize model
const { Op } = require('sequelize');

/**
 * ActivationCode Service
 * Handling Activation Code related operations
 */
const ActivationCodeService = {
  // Create a new activation code
  create: async (userId, activationCode) => {
    try {
      return await ActivationCode.create({ user_id: userId, activation_code: activationCode });
    } catch (error) {
      console.error("❌ Error creating activation code:", error.message);
      throw new Error("Failed to create activation code.");
    }
  },

  // Find activation code by the code string
  findByCode: async (activationCode) => {
    try {
      return await ActivationCode.findOne({ where: { activation_code: activationCode } });
    } catch (error) {
      console.error("❌ Error finding activation code:", error.message);
      throw new Error("Failed to find activation code.");
    }
  },

  // Remove activation code
  remove: async (activationCode) => {
    try {
      return await ActivationCode.destroy({ where: { activation_code: activationCode } });
    } catch (error) {
      console.error("❌ Error removing activation code:", error.message);
      throw new Error("Failed to remove activation code.");
    }
  },

  // Validate activation code (Check if exists and not expired)
  validateActivationCode: async (code) => {
    try {
      const activation = await ActivationCode.findOne({
        where: {
          activation_code: code,
          expires_at: { [Op.gt]: new Date() }, // Only fetch unexpired codes
        },
      });

      if (!activation) throw new Error('Invalid or expired activation code.');
      return activation;
    } catch (error) {
      console.error('❌ Error validating activation code:', error.message);
      throw new Error('Failed to validate activation code.');
    }
  },

  // Get all activation codes for a user
  getActivationCodesByUserId: async (userId) => {
    try {
      return await ActivationCode.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      console.error('❌ Error fetching activation codes:', error.message);
      throw new Error('Failed to fetch activation codes.');
    }
  },

  // Update activation code
  updateActivationCode: async (id, newData) => {
    try {
      const result = await ActivationCode.update(newData, { where: { id } });
      return result[0] > 0; // Returns true if rows were updated
    } catch (error) {
      console.error('❌ Error updating activation code:', error.message);
      throw new Error('Failed to update activation code.');
    }
  },

  // Delete activation code
  deleteActivationCode: async (id) => {
    try {
      const result = await ActivationCode.destroy({ where: { id } });
      return result > 0;
    } catch (error) {
      console.error('❌ Error deleting activation code:', error.message);
      throw new Error('Failed to delete activation code.');
    }
  },
};

module.exports = ActivationCodeService;
