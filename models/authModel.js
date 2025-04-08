require('dotenv').config();
const bcryptUtils = require('../utils/bcryptUtils');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const moment = require('moment');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const tenancy = require('../middleware/tenancyMiddleware'); // Multi-tenancy middleware

// Import centralized models from db.js
const { models } = require('../config/db'); // Import models from centralized db.js
const { User, Subscription, ActivationCode } = models; // Access models from db.js

// Utility Functions
const generateRandomCode = () => crypto.randomBytes(20).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const getExpiryDate = (unit, value) => moment().add(value, unit).toDate();

// Email Sending Utility
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
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error('Failed to send email');
  }
};

// Activation Code Service (Sequelize Model Handling)
const ActivationCodeService = {
  create: async (userId, activationCode) => 
    await ActivationCode.create({ user_id: userId, activation_code: activationCode }),

  findByCode: async (activationCode) => 
    await ActivationCode.findOne({ where: { activation_code: activationCode } }),

  remove: async (activationCode) => 
    await ActivationCode.destroy({ where: { activation_code: activationCode } }),
};

// Subscription Service (Sequelize Model Handling)
const SubscriptionService = {
  createTrial: async (userId) => 
    await Subscription.createFreeTrial(userId),

  createSubscription: async (userId, plan, startDate, endDate) => 
    await Subscription.createSubscription(userId, plan, startDate, endDate),

  getSubscriptionByUser: async (userId) => 
    await Subscription.getActiveSubscription(userId),
};

// Authentication Logic

// Signup Logic
const signup = async ({ username, email, password, confirmpassword }) => {
  if (password !== confirmpassword) throw new Error('Passwords do not match');
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error('User already exists. Please log in.');

  const hashedPassword = await bcryptUtils.hash(password, 10);
  const user = await User.create({ username, email, password: hashedPassword, role: 'user' });

  const activationCode = generateRandomCode();
  await ActivationCodeService.create(user.id, activationCode);

  const activationLink = `${process.env.APP_URL}/activate?code=${activationCode}`;
  await sendEmail(email, 'Activate Your Account', `Click the link to activate: ${activationLink}`);

  await SubscriptionService.createTrial(user.id);
  await user.update({ is_active: true });

  return { id: user.id, username, email };
};

// Login Logic
const login = async (email, password, tenant) => {
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const tenantDb = await tenancy.getTenantDatabase(tenant); // Fetch tenant DB using tenancy middleware
  const user = await User.findOne({ where: { email }, transaction: tenantDb });

  if (!user) throw new Error('Invalid email or password');
  if (!user.is_active) throw new Error('Account is not activated');

  const isMatch = await bcryptUtils.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  const subscription = await SubscriptionService.getSubscriptionByUser(user.id);
  if (!subscription) throw new Error('No subscription found. Please contact support.');

  return { id: user.id, username: user.username, email: user.email, subscription };
};

// Password Reset Logic
const resetPassword = async (email) => {
  if (!validator.isEmail(email)) throw new Error('Invalid email format');

  const user = await User.findOne({ where: { email } });
  if (!user) return { message: 'If an account exists, a reset link has been sent.' };

  const resetToken = generateRandomCode();
  const hashedToken = hashToken(resetToken);
  const expiryDate = getExpiryDate('hours', 1);

  await user.update({ password_reset_token: hashedToken, password_reset_expires: expiryDate });

  const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  await sendEmail(email, 'Password Reset', `Click to reset your password: ${resetLink}`);

  return { message: 'If an account exists, a reset link has been sent.' };
};

// AuthModel for handling JWT tokens with tenancy logic
class AuthModel {
  // Verifies user credentials for login
  static async verifyCredentials(email, password, tenant) {
    try {
      const tenantDb = await tenancy.getTenantDatabase(tenant); // Multi-tenancy DB handling
      const user = await User.findOne({ where: { email }, transaction: tenantDb });

      if (!user) throw new Error('User not found.');

      const isPasswordValid = await bcryptUtils.compare(password, user.password);
      if (!isPasswordValid) throw new Error('Invalid password.');

      return user;
    } catch (error) {
      console.error('❌ Error during credential verification:', error.message);
      throw error;
    }
  }

  // Generates JWT token for the user
  static generateToken(user) {
    try {
      const payload = {
        user_id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    } catch (error) {
      console.error('❌ Error generating token:', error.message);
      throw new Error('Could not generate token.');
    }
  }

  // Decodes JWT token to extract user information
  static decodeToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('❌ Error decoding token:', error.message);
      throw new Error('Invalid token.');
    }
  }

  // Authenticate user, verify credentials, and generate JWT token
  static async authenticate(email, password, tenant) {
    try {
      const user = await this.verifyCredentials(email, password, tenant);
      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      console.error('❌ Error during authentication:', error.message);
      throw error;
    }
  }
}

module.exports = {
  signup,
  login,
  resetPassword,
  ActivationCodeservice,
  SubscriptionService,
  AuthModel,
};
