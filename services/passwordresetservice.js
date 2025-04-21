const { PasswordReset, User } = require('../models'); // Import models correctly
const { v4: uuidv4 } = require('uuid');

// Generate a reset token for password reset
exports.generateResetToken = async (userId) => {
  const code = uuidv4();  // Generate a unique UUID as the reset token
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + 1); // Set expiry to 1 hour from now

  const resetRecord = await PasswordReset.create({
    user_id: userId,  // Ensure the field name is user_id as per the model definition
    reset_code: code,
    expires_at: expirationTime,  // Set the expiry date for the token
    created_at: new Date(),  // Use the correct field name
  });

  return { code, resetRecord };
};

// Verify the reset token's validity
exports.verifyResetToken = async (code) => {
  const now = new Date();

  const reset = await PasswordReset.findOne({
    where: {
      reset_code: code,
      expires_at: { [Op.gt]: now }, // Check if the token has not expired
    },
  });

  if (!reset) return null;  // Return null if token doesn't exist or has expired

  return reset;  // Return the reset entry for further validation
};
