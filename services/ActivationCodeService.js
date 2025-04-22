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

  // Create the activation record with the option for a transaction
  const activationRecord = await ActivationCode.create({
    user_id: userId,
    activation_code: hashedCode,
    expires_at: expiresAt,
    created_at: new Date(),
  }, { transaction });

  return { rawCode, activationRecord };
};

/**
 * Build Activation Email Content
 */
const buildActivationEmail = (email, code, userId) => {
  const activationLink = `${process.env.CLIENT_URL}/activate-account?user=${userId}`;
  return {
    subject: 'Activate Your Account',
    html: `
      <h2>Activate Your Account</h2>
      <p>Use the following code to activate your account:</p>
      <h3>${code}</h3>
      <p>Or click the link below:</p>
      <a href="${activationLink}">${activationLink}</a>
      <p>This code will expire in 24 hours.</p>
    `
  };
};

/**
 * Send Activation Email to New User
 */
const sendActivationEmail = async (user, transaction = null) => {
  // Generate activation code and save it, passing transaction if necessary
  const { rawCode } = await generateActivationCode(user.id, transaction); 

  // Build email content
  const { subject, html } = buildActivationEmail(user.email, rawCode, user.id);

  // Send the email to the user
  await sendEmail(user.email, subject, html);
};

/**
 * Verify Submitted Activation Code
 */
const verifyActivationCode = async (submittedCode, userId, transaction = null) => {
  const now = new Date();

  // Find the most recent valid activation code for the user
  const record = await ActivationCode.findOne({
    where: {
      user_id: userId,
      expires_at: { [Op.gt]: now }, // Check if the code is still valid
    },
    order: [['created_at', 'DESC']], // Ensure we get the most recent code
    transaction,
  });

  // If no valid record is found or the code has expired
  if (!record) throw new Error('No valid activation code found or it has expired.');

  // Compare the submitted code with the stored (hashed) code
  const isMatch = await bcrypt.compare(submittedCode, record.activation_code);
  if (!isMatch) throw new Error('Invalid activation code.');

  // Find the user associated with the activation code
  const user = await User.findByPk(userId, { transaction });
  if (!user) throw new Error('User not found.');

  // Update user status to 'active'
  user.status = 'active';
  await user.save({ transaction });

  // Optional: Soft-delete or log the activation code instead of destroying it
  await record.destroy({ transaction }); // Optionally log instead of deleting

  return true;
};

module.exports = {
  generateActivationCode,
  sendActivationEmail,
  verifyActivationCode,
};
