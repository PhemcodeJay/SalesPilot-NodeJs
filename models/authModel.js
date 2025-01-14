require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment');
const validator = require('validator');
const db = require('../config/database'); // Assuming this is your database configuration
const User = require('../models/user'); // Importing the User model

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

  const existingUser = await User.findUserByEmail(email);
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

  const result = await User.createUser(userData);

  const userId = result.insertId;
  const activationCode = generateRandomCode();
  await User.insertActivationCode(userId, activationCode, getExpiryDate('days', 1));

  const activationLink = `${process.env.APP_URL}/activate?code=${activationCode}`;
  await sendEmail(email, 'Activate Your Account', `Click to activate: ${activationLink}`);

  // Subscriptions table could be handled in the User model as well
  await User.insertSubscription(userId, 'trial', moment().toDate(), getExpiryDate('months', 3), 'active', 1);

  return { id: userId, username, email };
};

// Find a user by email
const findUserByEmail = async (email) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0]; // Return the first user found (if any)
  } catch (error) {
    throw new Error('Error fetching user by email');
  }
};

// Login
const login = async (email, password) => {
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const user = await User.getByEmail(email);
  if (!user) throw new Error('Invalid email or password');

  if (!user.is_active) throw new Error('Account is not activated');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  return { id: user.id, username: user.username, email: user.email };
};

// Reset Password
const resetPassword = async (email) => {
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const user = await User.getByEmail(email);
  if (!user) {
    return { message: 'If an account exists, a reset link has been sent.' };
  }

  const resetToken = generateRandomCode();
  const hashedToken = hashToken(resetToken);

  await User.insertPasswordReset(user.id, hashedToken, getExpiryDate('hours', 1));

  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  await sendEmail(email, 'Password Reset', `Click to reset your password: ${resetLink}`);

  return { message: 'If an account exists, a reset link has been sent.' };
};

// Create new user (for internal use)
const createUser = async (userData) => {
  try {
    const query = 'INSERT INTO users SET ?';
    const result = await db.query(query, userData);
    return result;
  } catch (err) {
    throw new Error(err.message);
  }
};

// Insert activation code (for internal use)
const insertActivationCode = async (userId, activationCode, expiryDate) => {
  try {
    const query = 'INSERT INTO activation_codes (user_id, activation_code, expiry_date) VALUES (?, ?, ?)';
    await db.query(query, [userId, activationCode, expiryDate]);
  } catch (err) {
    throw new Error(err.message);
  }
};

// Insert subscription (for internal use)
const insertSubscription = async (userId, type, startDate, endDate, status, planId) => {
  try {
    const query = 'INSERT INTO subscriptions (user_id, type, start_date, end_date, status, plan_id) VALUES (?, ?, ?, ?, ?, ?)';
    await db.query(query, [userId, type, startDate, endDate, status, planId]);
  } catch (err) {
    throw new Error(err.message);
  }
};

// Insert password reset (for internal use)
const insertPasswordReset = async (userId, hashedToken, expiryDate) => {
  try {
    const query = 'INSERT INTO password_resets (user_id, reset_token, expiry_date) VALUES (?, ?, ?)';
    await db.query(query, [userId, hashedToken, expiryDate]);
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  signup,
  login,
  resetPassword,
  findUserByEmail,
  createUser,
  insertActivationCode,
  insertSubscription,
  insertPasswordReset,
};
