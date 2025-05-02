const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, ActivationCode } = require('../models');
const { logError } = require('../utils/logger');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change to your provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send activation email
async function sendActivationEmail(email, code) {
  const link = `${process.env.BASE_URL}/api/auth/activate/${code}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Activate Your Account',
    html: `
      <h2>Welcome to Our Service</h2>
      <p>To activate your account, click the following link:</p>
      <a href="${link}">${link}</a>
      <p>If you did not request this activation, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Activation email sent to:', email);
  } catch (error) {
    logError('sendActivationEmail failed', error);
    throw new Error('Failed to send activation email.');
  }
}

// Send password reset email
async function sendPasswordResetEmail(user) {
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const message = `
    <h3>Hello ${user.name},</h3>
    <p>You requested a password reset. To reset your password, click the link below:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>Thanks,<br />The SalesPilot Team</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Password Reset Request',
    html: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
  } catch (error) {
    logError('sendPasswordResetEmail failed', error);
    throw new Error('Failed to send password reset email.');
  }
}

// Limit resend: only allow one code every 5 minutes
async function canResendActivationCode(userId) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const recentCode = await ActivationCode.findOne({
    where: {
      user_id: userId,
      created_at: { [Op.gt]: fiveMinutesAgo },
    },
  });

  return !recentCode;
}

// Clean expired codes
async function deleteExpiredActivationCodes() {
  try {
    await ActivationCode.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() },
      },
    });
    console.log('Old activation codes cleaned.');
  } catch (err) {
    logError('deleteExpiredActivationCodes failed', err);
  }
}

module.exports = {
  sendActivationEmail,
  sendPasswordResetEmail,
  canResendActivationCode,
  deleteExpiredActivationCodes,
};
