const bcrypt = require('bcryptjs');
const { generateResetToken, verifyResetToken } = require('../services/passwordresetService');
const { User } = require('../models');
const { sendPasswordResetEmail } = require('../utils/emailUtils');

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
    const { code } = await generateResetToken(user.id);

    // Send reset email with the generated token
    const resetLink = `${process.env.FRONTEND_URL}/recoverpwd?token=${code}`;
    await sendPasswordResetEmail(user, resetLink);

    // Response with success message and standardized data structure
    return res.status(200).json({
      message: 'Password reset email sent',
      data: { email: user.email }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Handle Password Reset with Token
const resetPassword = async (req, res) => {
  const { resetCode, newPassword } = req.body;

  try {
    // Verify the reset token using the service
    const resetEntry = await verifyResetToken(resetCode);

    if (!resetEntry) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Find the user by user_id in the reset entry
    const user = await User.findByPk(resetEntry.user_id);
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

    // Return successful response with standardized payload
    return res.status(200).json({
      message: 'Password successfully reset',
      data: { userId: user.id, email: user.email }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
