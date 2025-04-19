const PasswordReset = require('../models/passwordreset');
const { v4: uuidv4 } = require('uuid');

// Generate a reset token for password reset
exports.generateResetToken = async (userId) => {
  const code = uuidv4();  // Generate a unique UUID as the reset token
  await PasswordReset.create({ userId, code, createdAt: new Date() });
  return { code };
};

// Verify the reset token's validity
exports.verifyResetToken = async (code) => {
  const reset = await PasswordReset.findOne({ where: { code } });
  if (!reset) return null;  // Return null if token doesn't exist or is invalid
  // Optionally check expiry if needed
  return reset;  // Return the reset entry for further validation
};
