const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Tenant, ActivationCode, Subscription } = require('../models');
const { createSubscription } = require('./subscriptionService');
const { generateActivationCode, validateActivationCode } = require('./activationCodeService');
const { logError } = require('../utils/logger');
const { sequelize, getTenantDb, syncModels } = require('../config/db'); // For tenant-specific DBs
const validator = require('validator');  // To check for valid email format

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false'; // true if enabled
const ENV = process.env.NODE_ENV || 'development';  // Ensure this reflects the environment setting

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// User Sign-Up
const signUp = async (userData, tenantData) => {
  try {
    if (!userData.email || !userData.password || !tenantData.name) {
      throw new Error('Missing required fields');
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // 1. Create tenant in the main DB
    const tenant = await Tenant.create({ ...tenantData });
    if (!tenant) throw new Error('Failed to create tenant');

    // Dynamically create the tenant's own database
    const tenantDbName = `tenant_${tenant.id}`;
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${tenantDbName};`);
    const tenantDb = getTenantDb(tenantDbName);  // Get Sequelize instance for the new tenant DB
    await syncModels(tenantDb);  // Sync models to create tables for this tenant

    // 2. Create user associated with the tenant in the main DB
    const user = await User.create({
      ...userData,
      password: hashedPassword,
      tenant_id: tenant.id,  // Link user to the tenant
      status: EMAIL_ENABLED ? 'inactive' : 'active',
    });
    if (!user) throw new Error('Failed to create user');

    // 3. Create subscription (trial by default)
    const subscription = await createSubscription(tenant.id, 'trial');
    if (!subscription) throw new Error('Failed to create subscription');

    let activationCode = null;
    // 4. If email is enabled, generate activation code
    if (EMAIL_ENABLED) {
      activationCode = await generateActivationCode(user.id);
      if (!activationCode) throw new Error('Failed to generate activation code');
    }

    // Insert into main database tables successfully
    // Tenant is inserted via Tenant.create
    // User is inserted via User.create
    // Subscription is created by the `createSubscription` method

    return { user, tenant, subscription, activationCode };
  } catch (err) {
    logError('signUp service failed', err);
    throw err;  // Re-throw error to be handled by the controller
  }
};

// User Login (with username or email)
const login = async (usernameOrEmail, password) => {
  try {
    if (!usernameOrEmail || !password) {
      throw new Error('Username/Email and password are required');
    }

    // Check if the input is an email
    const isEmail = validator.isEmail(usernameOrEmail);

    // Find user by either email or username
    const user = await User.findOne({
      where: {
        [isEmail ? 'email' : 'username']: usernameOrEmail, // Use email or username field based on input
      },
    });

    if (!user || user.status !== 'active') {
      const errMsg = 'Invalid credentials or inactive account';
      logError(errMsg, new Error(errMsg));
      throw new Error(errMsg);
    }

    // Validate password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const errMsg = 'Invalid credentials';
      logError(errMsg, new Error(errMsg));
      throw new Error(errMsg);
    }

    // Auto-activate user in development if EMAIL_ENABLED is false (dev mode logic)
    if (ENV === 'development' && user.status !== 'active') {
      await User.update({ status: 'active' }, { where: { id: user.id } });
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
    throw err;  // Re-throw error to be handled by the controller
  }
};

// Activate User
const activateUser = async (code, userId) => {
  try {
    if (!code || !userId) {
      throw new Error('Activation code and user ID are required');
    }

    // Find the user by ID
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    // If user is already active, return true
    if (user.status === 'active') {
      return true;
    }

    // Validate the activation code
    const isValid = await validateActivationCode(code, userId);
    if (!isValid) {
      const errMsg = 'Invalid or expired activation code';
      logError(errMsg, new Error(errMsg));
      return false;
    }

    // Update the user status to active
    await User.update({ status: 'active' }, { where: { id: userId } });
    // Remove the activation code once used
    await ActivationCode.destroy({ where: { code, user_id: userId } });

    return true;
  } catch (err) {
    logError('activateUser service failed', err);
    throw err;  // Re-throw error to be handled by the controller
  }
};

// Refresh Token
const refreshToken = async (oldToken) => {
  try {
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
    throw err;  // Re-throw error to be handled by the controller
  }
};

module.exports = {
  signUp,
  login,
  activateUser,
  refreshToken,
};
