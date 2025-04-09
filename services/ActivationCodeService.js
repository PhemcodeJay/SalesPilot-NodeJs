const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const ActivationCode = require('../models/activationCode');
const { generateToken } = require('../config/auth');

const sendActivationEmail = async (user) => {
  const activationCode = crypto.randomBytes(16).toString('hex');
  await ActivationCode.create({
    user_id: user.id,
    activation_code: activationCode,
    expires_at: new Date(Date.now() + 3600000), // 1 hour expiry
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const activationLink = `${process.env.APP_URL}/activate/${activationCode}`;
  await transporter.sendMail({
    to: user.email,
    subject: 'Account Activation',
    text: `Please activate your account using this link: ${activationLink}`,
  });
};

module.exports = { sendActivationEmail };
