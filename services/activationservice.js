const ActivationCode = require('../models/ActivationCode');
const { Op } = require('sequelize');

// Ensure table is created
const syncDB = async () => {
  try {
    await ActivationCode.sync({ alter: true });
    console.log('✅ Activation Codes table is ready.');
  } catch (error) {
    console.error('❌ Error syncing table:', error.message);
  }
};

// Create a new activation code
const createActivationCode = async (userId, code, expiresAt) => {
  try {
    return await ActivationCode.create({ user_id: userId, activation_code: code, expires_at: expiresAt });
  } catch (error) {
    throw new Error('❌ Error creating activation code: ' + error.message);
  }
};

// Fetch activation code by ID
const getActivationCodeById = async (id) => {
  try {
    const activation = await ActivationCode.findByPk(id);
    if (!activation) throw new Error('Activation code not found.');
    return activation;
  } catch (error) {
    throw new Error('❌ Error fetching activation code: ' + error.message);
  }
};

// Get all activation codes for a user
const getActivationCodesByUserId = async (userId) => {
  try {
    return await ActivationCode.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  } catch (error) {
    throw new Error('❌ Error fetching activation codes: ' + error.message);
  }
};

// Validate activation code (Check if exists and not expired)
const validateActivationCode = async (code) => {
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
    throw new Error('❌ Error validating activation code: ' + error.message);
  }
};

// Update activation code
const updateActivationCode = async (id, newData) => {
  try {
    const result = await ActivationCode.update(newData, { where: { id } });
    return result[0] > 0; // Returns true if rows were updated
  } catch (error) {
    throw new Error('❌ Error updating activation code: ' + error.message);
  }
};

// Delete activation code
const deleteActivationCode = async (id) => {
  try {
    const result = await ActivationCode.destroy({ where: { id } });
    return result > 0;
  } catch (error) {
    throw new Error('❌ Error deleting activation code: ' + error.message);
  }
};

// Export functions
module.exports = {
  syncDB,
  createActivationCode,
  getActivationCodeById,
  getActivationCodesByUserId,
  validateActivationCode,
  updateActivationCode,
  deleteActivationCode,
};
