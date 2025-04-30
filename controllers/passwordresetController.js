const { User } = require('../models');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const PasswordResetService = require('../services/passwordresetService');
const { logError } = require('../utils/logger');

// ✅ Request Password Reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { code } = await PasswordResetService.generateResetToken(user.id);

    const resetLink = `${process.env.FRONTEND_URL}/recoverpwd?token=${code}`;
    await sendPasswordResetEmail(user, resetLink);

    res.status(200).json({
      message: 'Password reset email sent successfully',
      data: { email: user.email }
    });
  } catch (error) {
    logError('requestPasswordReset error', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// ✅ Reset Password
const resetPassword = async (req, res) => {
  const { resetCode, newPassword } = req.body;

  try {
    const resetStatus = await PasswordResetService.resetPassword(resetCode, newPassword);

    if (!resetStatus) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    res.status(200).json({ message: 'Password successfully reset' });
  } catch (error) {
    logError('resetPassword error', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
