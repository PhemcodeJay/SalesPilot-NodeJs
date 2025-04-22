const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const PasswordResetService = require('../services/passwordresetService');  // Importing the password reset service
const { User } = require('../models');  // Import User model

// ✅ Request Password Reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token using the service
    const { code } = await PasswordResetService.generateResetToken(user.id);

    // Send reset email with the generated token
    const resetLink = `${process.env.FRONTEND_URL}/recoverpwd?token=${code}`;
    await sendPasswordResetEmail(user, resetLink);  // Send the email with the reset link

    // Return standardized success response
    return res.status(200).json({
      message: 'Password reset email sent successfully',
      data: { email: user.email }
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Handle Password Reset with Token
const resetPassword = async (req, res) => {
  const { resetCode, newPassword } = req.body;

  try {
    // Reset the password using the service
    await PasswordResetService.resetPassword(resetCode, newPassword);  // Calling the service to reset the password

    // Return successful response with standardized payload
    return res.status(200).json({
      message: 'Password successfully reset'
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ error: error.message });  // Return specific error message from the service
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
