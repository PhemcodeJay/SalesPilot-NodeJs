const { Op } = require("sequelize");
const crypto = require("crypto");
const { models } = require("../config/db"); // Use dynamically loaded models

const User = models.User; // Get the User model

/**
 * ✅ Generate and store an activation token for a user
 * @param {number} userId - User ID
 * @returns {Promise<string>} - The generated activation token
 */
async function generateActivationToken(userId) {
  try {
    const activationToken = crypto.randomBytes(32).toString("hex");
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await User.update(
      {
        activation_token: activationToken,
        activation_token_expiry: expiryDate,
      },
      {
        where: { id: userId },
      }
    );

    return activationToken;
  } catch (err) {
    throw new Error(`Failed to generate activation token: ${err.message}`);
  }
}

/**
 * ✅ Validate activation token and activate user account
 * @param {string} token - Activation token
 * @returns {Promise<boolean>} - True if user was activated
 */
async function activateUser(token) {
  try {
    const user = await User.findOne({
      where: {
        activation_token: token,
        activation_token_expiry: { [Op.gt]: new Date() }, // Token must still be valid
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
  } catch (err) {
    throw new Error(`Activation failed: ${err.message}`);
  }
}

module.exports = {
  generateActivationToken,
  activateUser,
};
