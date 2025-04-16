const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { models } = require('../config/db');  // Use centralized model access
const { Op } = require('sequelize');
const { sendEmail } = require('../utils/emailUtils');  // Email sender

/**
 * Send Activation Email to a New User
 */
const sendActivationEmail = async (user) => {
  const rawCode = crypto.randomBytes(3).toString('hex').toUpperCase();  // 6-char readable code
  const hashedCode = await bcrypt.hash(rawCode, 10);

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now

  // Save hashed activation code to DB
  await models.ActivationCode.create({
    user_id: user.id,
    activation_code: hashedCode,
    expires_at: expiresAt,
  });

  // Compose email
  const activationLink = `${process.env.CLIENT_URL}/activate-account?user=${user.id}`;
  const emailBody = `
    <h2>Activate Your Account</h2>
    <p>Use the following code to activate your account:</p>
    <h3>${rawCode}</h3>
    <p>Or click: <a href="${activationLink}">Activate Account</a></p>
    <p>This code will expire in 24 hours.</p>
  `;

  await sendEmail(user.email, 'Activate Your Account', emailBody);
};

/**
 * Verify Activation Code Provided by the User
 */
const verifyActivationCode = async (submittedCode, userId) => {
  const now = new Date();

  const record = await models.ActivationCode.findOne({
    where: {
      user_id: userId,
      expires_at: { [Op.gt]: now },
    },
  });

  if (!record) {
    throw new Error('No valid activation code found or it has expired.');
  }

  const isMatch = await bcrypt.compare(submittedCode, record.activation_code);
  if (!isMatch) {
    throw new Error('Invalid activation code.');
  }

  // Optional: Activate user status here if needed
  const user = await models.User.findByPk(userId);
  user.status = 'active';
  await user.save();

  await record.destroy();  // Invalidate code after use

  return true;
};

module.exports = {
  sendActivationEmail,
  verifyActivationCode,
};
