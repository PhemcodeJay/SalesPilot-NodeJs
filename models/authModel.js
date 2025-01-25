require('dotenv').config();
const bcryptUtils = require('../utils/bcryptUtils');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment');
const validator = require('validator');
const pool = require('../config/db'); // Assuming a MySQL connection pool
const User = require('../models/user'); // User model
const Subscription = require('../models/subscriptions'); // Subscription model

// Utility Functions
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
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Failed to send email');
  }
};

// Activation Code Model
const ActivationCode = {
  create: async (userId, activationCode) => {
    const result = await pool.execute(
      `INSERT INTO activation_codes (user_id, activation_code) VALUES (?, ?)`,
      [userId, activationCode]
    );
    return result;
  },

  findByCode: async (activationCode) => {
    const [rows] = await pool.execute(
      `SELECT * FROM activation_codes WHERE activation_code = ?`,
      [activationCode]
    );
    return rows[0];
  },

  remove: async (activationCode) => {
    const result = await pool.execute(
      `DELETE FROM activation_codes WHERE activation_code = ?`,
      [activationCode]
    );
    return result;
  },
};

// Subscription Model
const SubscriptionService = {
  createTrial: async (userId) => {
    // Using the Subscription model's method to create a free trial
    return Subscription.createFreeTrial(userId);
  },

  createSubscription: async (userId, plan, startDate, endDate) => {
    // Using the Subscription model's method to create a paid subscription
    return Subscription.createSubscription(userId, plan, startDate, endDate);
  },

  getSubscriptionByUser: async (userId) => {
    // Using the Subscription model's method to fetch a user's subscription
    return Subscription.getActiveSubscription(userId);
  },
};

// Authentication Logic
const signup = async ({ username, email, password, confirmpassword }) => {
  if (password !== confirmpassword) throw new Error('Passwords do not match');
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const existingUser = await User.findUserByEmail(email);
  if (existingUser) throw new Error('User already exists. Please log in.');

  const hashedPassword = await bcryptUtils.hash(password, 10);
  const userData = {
    username,
    email,
    password: hashedPassword,
    role: 'user',
  };

  const result = await User.createUser(userData);
  const userId = result.insertId;

  const activationCode = generateRandomCode();
  await ActivationCode.create(userId, activationCode);

  const activationLink = `${process.env.APP_URL}/activate?code=${activationCode}`;
  await sendEmail(email, 'Activate Your Account', `Click the link to activate: ${activationLink}`);

  // Create free trial subscription for the user
  await SubscriptionService.createTrial(userId);

  return { id: userId, username, email };
};

const login = async (email, password) => {
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const user = await User.getByEmail(email);
  if (!user) throw new Error('Invalid email or password');
  if (!user.is_active) throw new Error('Account is not activated');

  const isMatch = await bcryptUtils.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  // Fetch the active subscription of the user
  const subscription = await SubscriptionService.getSubscriptionByUser(user.id);
  if (!subscription) throw new Error('No subscription found. Please contact support.');

  return { id: user.id, username: user.username, email: user.email, subscription };
};

const resetPassword = async (email) => {
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const user = await User.getByEmail(email);
  if (!user) return { message: 'If an account exists, a reset link has been sent.' };

  const resetToken = generateRandomCode();
  const hashedToken = hashToken(resetToken);
  const expiryDate = getExpiryDate('hours', 1);

  await User.insertPasswordReset(user.id, hashedToken, expiryDate);

  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  await sendEmail(email, 'Password Reset', `Click to reset your password: ${resetLink}`);

  return { message: 'If an account exists, a reset link has been sent.' };
};

module.exports = {
  signup,
  login,
  resetPassword,
  ActivationCode,
  SubscriptionService,
};
