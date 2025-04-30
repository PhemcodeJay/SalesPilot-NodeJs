const { ActivationCode, User } = require('../models');
const { logError } = require('../utils/logger'); // Assuming you have an email service

// Generate activation code for a user
const generateActivationCode = async (userId) => {
  try {
    const code = Math.random().toString(36).substr(2, 8); // Example: Random 8-character code

    // Save the activation code to the database
    const activationCode = await ActivationCode.create({
      user_id: userId,
      code,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Code expires in 24 hours
    });

    // Optionally, send the activation email (if email is enabled)
    if (process.env.EMAIL_ENABLED !== 'false') {
      await sendActivationEmail(userId, code);
    }

    return activationCode.code;
  } catch (err) {
    logError('generateActivationCode failed', err);
    throw err;
  }
};

// Send activation email to the user (this is just an example)
const sendActivationEmail = async (userId, activationCode) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Your email sending logic here (e.g., using nodemailer)
    const emailBody = `Please use the following activation code to activate your account: ${activationCode}`;
    // Implement the actual email sending logic (skipping here for brevity)

    // Log for now (replace with actual email logic)
    console.log(`Sending activation email to ${user.email} with code ${activationCode}`);
  } catch (err) {
    logError('sendActivationEmail failed', err);
    throw err;
  }
};

// Verify activation code for a user
const verifyActivationCode = async (code, userId) => {
  try {
    const record = await ActivationCode.findOne({
      where: { code, user_id: userId },
    });

    // Check if the code exists and is still valid
    if (!record || new Date(record.expires_at) < new Date()) {
      return false; // Code not found or expired
    }

    return true; // Code valid
  } catch (err) {
    logError('verifyActivationCode failed', err);
    throw err;
  }
};

module.exports = {
  generateActivationCode,
  sendActivationEmail,
  verifyActivationCode,
};
