const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Tenant, } = require('../models');
const { createSubscription } = require('./subscriptionService');
const { logError } = require('../utils/logger');

// JWT config
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';

// Ensure JWT_SECRET is defined
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Sign-up service: create tenant, user, and subscription
const signUp = async (userData, tenantData) => {
  try {
    // Validate input fields
    if (!userData.email || !userData.password || !tenantData.name) {
      throw new Error('Missing required fields');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create tenant
    const tenant = await Tenant.create({ ...tenantData });
    if (!tenant) {
      throw new Error('Failed to create tenant');
    }

    // Create user with hashed password and inactive status
    const user = await User.create({
      ...userData,
      password: hashedPassword,
      tenant_id: tenant.id,
      status: process.env.EMAIL_ENABLED === 'false' ? 'active' : 'inactive',
    });
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Create subscription using SubscriptionService (3-month trial by default)
    const subscription = await createSubscription(tenant.id, 'trial');
    if (!subscription) {
      throw new Error('Failed to create subscription');
    }

    // Generate activation code if email sending is enabled
    let activationCode = null;
    if (process.env.EMAIL_ENABLED !== 'false') {
      activationCode = await generateActivationCode(user.id);
      if (!activationCode) {
        throw new Error('Failed to generate activation code');
      }
    }

    return { user, tenant, subscription, activationCode };
  } catch (err) {
    logError('signUp service failed', err);
    throw err;  // Rethrow to be handled by the controller
  }
};

// Login service: validate credentials and generate JWT token
const login = async (email, password) => {
  try {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user || user.status !== 'active') {
      const errMsg = 'Invalid credentials or inactive account';
      logError(errMsg, new Error(errMsg));
      throw new Error(errMsg);
    }

    // Compare the provided password with the hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const errMsg = 'Invalid credentials';
      logError(errMsg, new Error(errMsg));
      throw new Error(errMsg);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { user, token };
  } catch (err) {
    logError('login service failed', err);
    throw err;  // Rethrow to be handled by the controller
  }
};

// Activate user account after successful activation code validation
const activateUser = async (code, userId) => {
  try {
    // Validate input
    if (!code || !userId) {
      throw new Error('Activation code and user ID are required');
    }

    // Validate the activation code using ActivationCodeService
    const isValid = await validateActivationCode(code, userId);
    if (!isValid) {
      const errMsg = 'Invalid or expired activation code';
      logError(errMsg, new Error(errMsg));
      return false;
    }

    // Update user status to 'active'
    await User.update({ status: 'active' }, { where: { id: userId } });

    // If the code is valid, delete the activation code from the database
    await ActivationCode.destroy({ where: { code } });

    return true;
  } catch (err) {
    logError('activateUser service failed', err);
    throw err;  // Rethrow to be handled by the controller
  }
};

// Refresh token service: verify and generate a new token
const refreshToken = async (oldToken) => {
  try {
    // Validate input
    if (!oldToken) {
      throw new Error('Old token is required');
    }

    // Verify the old token
    const payload = jwt.verify(oldToken, JWT_SECRET);
    if (!payload) {
      const errMsg = 'Invalid refresh token';
      logError(errMsg, new Error(errMsg));
      throw new Error(errMsg);
    }

    // Generate a new JWT token
    const newToken = jwt.sign(
      { userId: payload.userId, role: payload.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { newToken };
  } catch (err) {
    logError('refreshToken service failed', err);
    throw err;  // Rethrow to be handled by the controller
  }
};

module.exports = {
  signUp,
  login,
  activateUser,
  refreshToken,
};
