const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PasswordReset = require('../models/passwordreset');
const User = require('../models/user');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const { JWT_SECRET } = process.env;

// Generate a password reset token and send it via email
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a password reset token
    const resetCode = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    // Save password reset entry in the database
    const resetEntry = await PasswordReset.create({
      user_id: user.id,
      reset_code: resetCode,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // Expires in 1 hour
    });

    // Send reset email (you can use a utility function to send the email)
    await sendPasswordResetEmail(user.email, resetCode);

    return res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle password reset (with token verification)
const resetPassword = async (req, res) => {
  const { resetCode, newPassword } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(resetCode, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the password reset entry
    const resetEntry = await PasswordReset.findOne({
      where: { user_id: user.id, reset_code: resetCode },
    });

    if (!resetEntry) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if the reset token has expired
    if (new Date() > resetEntry.expires_at) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
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
