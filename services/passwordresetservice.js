const { PasswordReset, User } = require('../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');  // Sequelize operators for comparison

// Generate a reset token for password reset
exports.generateResetToken = async (userId, transaction = null) => {
  const code = uuidv4();  // Generate a unique UUID as the reset token
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 1); // Set expiry to 1 hour from now

  const resetRecord = await PasswordReset.create({
    user_id: userId,
    reset_code: code,
    expires_at: expirationTime,  // Set the expiry date for the token
    created_at: new Date(),
  }, { transaction });

  return { code, resetRecord };
};

// Verify the reset token's validity
exports.verifyResetToken = async (code, transaction = null) => {
  const now = new Date();

  const reset = await PasswordReset.findOne({
    where: {
      reset_code: code,
      expires_at: { [Op.gt]: now }, // Check if the token has not expired
    },
    transaction,
  });

  if (!reset) return null;  // Return null if token doesn't exist or has expired

  return reset;
};

// Reset the password for the user
exports.resetPassword = async (resetCode, newPassword, transaction = null) => {
  const resetRecord = await this.verifyResetToken(resetCode, transaction);
  if (!resetRecord) {
    throw new Error('Invalid or expired reset token');
  }

  const user = await User.findByPk(resetRecord.user_id, { transaction });
  if (!user) {
    throw new Error('User not found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);  // Hash password

  user.password = hashedPassword;
  await user.save({ transaction });

  await resetRecord.destroy({ transaction });

  return true;
};
