const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { models } = require('../config/db');  // Import models from db.js
const { Op } = require('sequelize');  // Import Sequelize operators
const { sendEmail } = require('../utils/emailUtils');  // Assumed to exist

// Function to Send Activation Email to User
const sendActivationEmail = async (user) => {
  // Generate a raw activation code
  const rawCode = crypto.randomBytes(3).toString('hex').toUpperCase();  // 6-character code
  const hashedCode = await bcrypt.hash(rawCode, 10);  // Hash the code for storage

  // Set expiration for the activation code (24 hours)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);  // 24 hours expiration

  // Create activation code record in the database
  await models.ActivationCode.create({
    user_id: user.id,
    activation_code: hashedCode,
    expires_at: expiresAt,
  });

  // Prepare the email content
  const activationLink = `${process.env.CLIENT_URL}/activate-account?user=${user.id}`;
  const emailBody = `
    <h2>Activate Your Account</h2>
    <p>Use the following code to activate your account:</p>
    <h3>${rawCode}</h3>
    <p>Or click: <a href="${activationLink}">Activate Account</a></p>
  `;

  // Send the activation email to the user
  await sendEmail(user.email, 'Activate Your Account', emailBody);
};

// Function to Verify the Activation Code Submitted by the User
const verifyActivationCode = async (submittedCode, userId) => {
  const now = new Date();

  // Find an active activation code for the user that has not expired
  const record = await models.ActivationCode.findOne({
    where: {
      user_id: userId,
      expires_at: { [Op.gt]: now },  // Ensure the activation code has not expired
    },
  });

  // If no record is found or it has expired
  if (!record) {
    throw new Error('No valid activation code found.');
  }

  // Compare the submitted code with the stored hashed code
  const isMatch = await bcrypt.compare(submittedCode, record.activation_code);
  if (!isMatch) {
    throw new Error('Invalid activation code.');
  }

  // Invalidate the activation code after successful verification
  await record.destroy();  // Delete the activation code record after use

  return true;  // Return success if everything is valid
};

module.exports = { sendActivationEmail, verifyActivationCode };
