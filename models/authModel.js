require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment');
const validator = require('validator');
const profile = require('../models/profile'); // Importing the profile model

// Utility functions
const generateRandomCode = () => crypto.randomBytes(20).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getExpiryDate = (unit, value) => moment().add(value, unit).toDate();

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 465,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Email sending error:', error.message);
    throw new Error('Failed to send email');
  }
};

// Authentication functions
const signup = async ({ username, email, password, confirmpassword }) => {
  if (password !== confirmpassword) throw new Error('Passwords do not match');
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const existingUser = await profile.findUserByEmail(email);
  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const userData = {
    username,
    email,
    password: hashedPassword,
    phone: '', // You can add phone if provided
    role: 'user', // You can set a default role or pass it from the request
    trial_end_date: moment().add(3, 'months').format('YYYY-MM-DD'), // Setting trial end date
  };

  const result = await profile.create(userData);

  const userId = result.insertId;
  const activationCode = generateRandomCode();
  await profile.insertActivationCode(userId, activationCode, getExpiryDate('days', 1));

  const activationLink = `${process.env.APP_URL}/activate?code=${activationCode}`;
  await sendEmail(email, 'Activate Your Account', `Click to activate: ${activationLink}`);

  // Subscriptions table could be handled in the profile model as well
  await profile.insertSubscription(userId, 'trial', moment().toDate(), getExpiryDate('months', 3), 'active', 1);

  return { id: userId, username, email };
};

// Login
const login = async (email, password) => {
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const user = await profile.getByEmail(email);
  if (!user) throw new Error('Invalid email or password');

  if (!user.is_active) throw new Error('Account is not activated');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  return { id: user.id, username: user.username, email: user.email };
};

// Reset Password
const resetPassword = async (email) => {
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const user = await profile.getByEmail(email);
  if (!user) {
    return { message: 'If an account exists, a reset link has been sent.' };
  }

  const resetToken = generateRandomCode();
  const hashedToken = hashToken(resetToken);

  await profile.insertPasswordReset(user.id, hashedToken, getExpiryDate('hours', 1));

  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  await sendEmail(email, 'Password Reset', `Click to reset your password: ${resetLink}`);

  return { message: 'If an account exists, a reset link has been sent.' };
};

module.exports = {
  signup,
  login,
  resetPassword,
};
