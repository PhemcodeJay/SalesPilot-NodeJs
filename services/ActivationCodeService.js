const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { models } = require('../config/db');  // Centralized model access
const { Op } = require('sequelize');
const { sendEmail } = require('../utils/emailUtils');  // Email sender
const { ActivationCode, User } = models;

/**
 * Generate a unique activation code for a user
 */
const generateActivationCode = async (userId) => {
  const code = crypto.randomBytes(20).toString('hex');  // Generate a unique code
  const activationCode = await ActivationCode.create({
    user_id: userId,
    code: code,
    expiry_date: new Date(Date.now() + 60 * 60 * 1000),  // 1-hour expiry
  });
  return activationCode;
};

/**
 * Send Activation Email to a New User
 */
const sendActivationEmail = async (user) => {
  const rawCode = crypto.randomBytes(3).toString('hex').toUpperCase();  // 6-character readable code
  const hashedCode = await bcrypt.hash(rawCode, 10);

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now

  // Save hashed activation code to DB
  await ActivationCode.create({
    user_id: user.id,
    activation_code: hashedCode,
    expires_at: expiresAt,
  });

  // Compose email with activation link
  const activationLink = `${process.env.CLIENT_URL}/activate-account?user=${user.id}`;
  const emailBody = `
    <h2>Activate Your Account</h2>
    <p>Use the following code to activate your account:</p>
    <h3>${rawCode}</h3>
    <p>Or click: <a href="${activationLink}">Activate Account</a></p>
    <p>This code will expire in 24 hours.</p>
  `;

  // Send the activation email
  await sendEmail(user.email, 'Activate Your Account', emailBody);
};

/**
 * Verify Activation Code Provided by the User
 */
const verifyActivationCode = async (submittedCode, userId) => {
  const now = new Date();

  // Find the latest activation code record for this user and check expiry
  const record = await ActivationCode.findOne({
    where: {
      user_id: userId,
      expires_at: { [Op.gt]: now },  // Ensure the code hasn't expired
    },
  });

  if (!record) {
    throw new Error('No valid activation code found or it has expired.');
  }

  // Compare the submitted code with the hashed activation code in the DB
  const isMatch = await bcrypt.compare(submittedCode, record.activation_code);
  if (!isMatch) {
    throw new Error('Invalid activation code.');
  }

  // Optionally, activate the user account status after successful activation
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  user.status = 'active';
  await user.save();

  // Invalidate the activation code after successful use
  await record.destroy();

  return true;
};

module.exports = {
  generateActivationCode,
  sendActivationEmail,
  verifyActivationCode,
};
