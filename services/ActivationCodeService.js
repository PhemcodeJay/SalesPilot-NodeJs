const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { models } = require('../config/db');
const { sendEmail } = require('../utils/emailUtils');

const { ActivationCode, User } = models;

// Generate and save a new activation code for a user
const generateActivationCode = async (userId, transaction = null) => {
  const rawCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char hex code
  const hashedCode = await bcrypt.hash(rawCode, 10);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const activationRecord = await ActivationCode.create({
    user_id: userId,
    activation_code: hashedCode,
    expires_at: expiresAt,
    created_at: new Date(),
  }, { transaction });

  return { rawCode, activationRecord };
};

// Build activation email content
const buildActivationEmail = (email, code, userId) => {
  const link = `${process.env.CLIENT_URL}/activate-account?user=${userId}`;
  return {
    subject: 'Activate Your SalesPilot Account',
    html: `
      <h2>Welcome to SalesPilot!</h2>
      <p>Use the code below to activate your account:</p>
      <h3>${code}</h3>
      <p>Or click this link:</p>
      <a href="${link}">${link}</a>
      <p><small>This code expires in 24 hours.</small></p>
    `
  };
};

// Send activation email to a user
const sendActivationEmail = async (user, transaction = null) => {
  if (user.status === 'active') {
    throw new Error('User is already active.');
  }

  const { rawCode } = await generateActivationCode(user.id, transaction);
  const { subject, html } = buildActivationEmail(user.email, rawCode, user.id);

  await sendEmail(user.email, subject, html);
};

// Verify submitted activation code
const verifyActivationCode = async (submittedCode, userId, transaction = null) => {
  const now = new Date();

  const record = await ActivationCode.findOne({
    where: {
      user_id: userId,
      expires_at: { [Op.gt]: now },
    },
    order: [['created_at', 'DESC']],
    transaction,
  });

  if (!record) throw new Error('Activation code expired or not found.');

  const isValid = await bcrypt.compare(submittedCode, record.activation_code);
  if (!isValid) throw new Error('Invalid activation code.');

  const user = await User.findByPk(userId, { transaction });
  if (!user) throw new Error('User not found.');

  if (user.status === 'active') {
    throw new Error('User is already activated.');
  }

  user.status = 'active';
  await user.save({ transaction });

  await record.destroy({ transaction }); // Clean up used code

  return true;
};

module.exports = {
  generateActivationCode,
  sendActivationEmail,
  verifyActivationCode,
};
