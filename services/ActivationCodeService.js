const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { models } = require('../config/db');
const { sendEmail } = require('../utils/emailUtils');

const { ActivationCode, User } = models;

/**
 * Generate and Save Activation Code for a User
 */
const generateActivationCode = async (userId, transaction = null) => {
  const rawCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-character readable code
  const hashedCode = await bcrypt.hash(rawCode, 10);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now

  const activationRecord = await ActivationCode.create({
    user_id: userId,
    activation_code: hashedCode,
    expires_at: expiresAt,
    created_at: new Date(),
  }, { transaction });

  return { rawCode, activationRecord };
};

/**
 * Send Activation Email to New User
 */
const sendActivationEmail = async (user) => {
  const { rawCode } = await generateActivationCode(user.id); // Save & get code

  const activationLink = `${process.env.CLIENT_URL}/activate-account?user=${user.id}`;
  const emailBody = `
    <h2>Activate Your Account</h2>
    <p>Use the following code to activate your account:</p>
    <h3>${rawCode}</h3>
    <p>Or click the link below:</p>
    <a href="${activationLink}">${activationLink}</a>
    <p>This code will expire in 24 hours.</p>
  `;

  await sendEmail(user.email, 'Activate Your Account', emailBody);
};

/**
 * Verify Submitted Activation Code
 */
const verifyActivationCode = async (submittedCode, userId) => {
  const now = new Date();

  const record = await ActivationCode.findOne({
    where: {
      user_id: userId,
      expires_at: { [Op.gt]: now },
    },
    order: [['created_at', 'DESC']],
  });

  if (!record) throw new Error('No valid activation code found or it has expired.');

  const isMatch = await bcrypt.compare(submittedCode, record.activation_code);
  if (!isMatch) throw new Error('Invalid activation code.');

  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found.');

  user.status = 'active';
  await user.save();

  await record.destroy(); // Invalidate code after use

  return true;
};

module.exports = {
  generateActivationCode,
  sendActivationEmail,
  verifyActivationCode,
};
