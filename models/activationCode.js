const { Op } = require("sequelize");
const { sequelize, models } = require("../config/db"); // Import models
const crypto = require("crypto");

const User = models.User; // Use the User model from db.js

/**
 * Generate and store activation token
 * @param {string} userId - ID of the user
 * @returns {Promise<string>} - Generated activation token
 */
async function generateActivationToken(userId) {
  const activationToken = crypto.randomBytes(32).toString("hex");
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

  await User.update(
    { activation_token: activationToken, activation_token_expiry: expiryDate },
    { where: { id: userId } }
  );

  return activationToken;
}

/**
 * Verify activation token and activate user
 * @param {string} token - Activation token
 * @returns {Promise<boolean>} - True if activation is successful
 */
async function activateUser(token) {
  const user = await User.findOne({
    where: {
      activation_token: token,
      activation_token_expiry: { [Op.gt]: new Date() }, // Token must not be expired
    },
  });

  if (!user) {
    throw new Error("Invalid or expired activation token.");
  }

  await user.update({
    is_active: true,
    activation_token: null,
    activation_token_expiry: null,
  });

  return true;
}

module.exports = { generateActivationToken, activateUser };
