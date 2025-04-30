const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const PasswordResetService = require('../services/passwordresetService');
const { User } = require('../models');

// Request Password Reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { code } = await PasswordResetService.generateResetToken(user.id);

    const resetLink = `${process.env.FRONTEND_URL}/recoverpwd?token=${code}`;
    await sendPasswordResetEmail(user, resetLink);  // Send email

    return res.status(200).json({
      message: 'Password reset email sent successfully',
      data: { email: user.email }
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// Handle Password Reset with Token
const resetPassword = async (req, res) => {
  const { resetCode, newPassword } = req.body;

  try {
    const resetStatus = await PasswordResetService.resetPassword(resetCode, newPassword);

    if (!resetStatus) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    return res.status(200).json({
      message: 'Password successfully reset'
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
