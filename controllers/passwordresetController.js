const bcrypt = require('bcryptjs');
const { generateResetToken, verifyResetToken } = require('../services/passwordresetService');  // Correct imports
const User = require('../models/user');
const { sendPasswordResetEmail } = require('../utils/emailUtils');

// Request Password Reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token using the service
    const { code } = await generateResetToken(user.id);

    // Send reset email with the generated token
    await sendPasswordResetEmail(user.email, code);

    return res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle Password Reset with Token
const resetPassword = async (req, res) => {
  const { resetCode, newPassword } = req.body;

  try {
    // Verify the reset token using the service
    const resetEntry = await verifyResetToken(resetCode);

    if (!resetEntry) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = await User.findByPk(resetEntry.user_id);  // Ensure you're using `user_id` from PasswordReset model
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    // Delete the password reset entry (used once)
    await resetEntry.destroy();

    return res.status(200).json({ message: 'Password successfully reset' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
