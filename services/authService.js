const { User, Tenant, Subscription, ActivationCode } = require('../models'); // Main DB models
const { logError } = require('../utils/logger');
const { generateActivationCode, verifyActivationCode } = require('./ActivationCodeService');
const { createSubscription } = require('./subscriptionService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getTenantDb, insertIntoBothDb } = require('../config/db'); // Import DB utilities

const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

// Helper to generate JWT token
const generateToken = (user) => {
  const payload = { 
    id: user.id, 
    email: user.email, 
    tenant_id: user.tenant_id,
    role: user.role 
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Sign Up Service - Handles user registration across both main and tenant databases
 * @param {Object} userData - User information
 * @param {Object} tenantData - Tenant information
 * @param {Object} tenantDbData - Data to insert into tenant database
 * @returns {Object} Result containing user, tenant, subscription, and activation info
 */
const signUp = async (userData, tenantData, tenantDbData = {}) => {
  try {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, BCRYPT_SALT_ROUNDS);
    
    // Prepare main DB data
    const mainDbData = {
      ...userData,
      password: hashedPassword,
      status: EMAIL_ENABLED ? 'inactive' : 'active',
      tenant: tenantData // Include tenant data for creation
    };

    // Use the helper function to insert into both databases
    const result = await insertIntoBothDb(mainDbData, tenantDbData, tenantData.name);
    
    // Generate activation code if email is enabled
    let activationCode = null;
    if (EMAIL_ENABLED) {
      activationCode = await generateActivationCode(result.user.id);
    }

    return {
      user: result.user,
      tenant: result.tenant,
      subscription: result.subscription,
      activationCode,
      redirectPath: EMAIL_ENABLED ? '/auth/activate' : null
    };

  } catch (err) {
    logError('signUp service error', err);
    throw new Error(err.message || 'Signup failed. Please try again.');
  }
};

/**
 * Login Service - Authenticates user and generates JWT token
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} Contains user info and JWT token
 */
const login = async (email, password) => {
  try {
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Tenant,
        attributes: ['id', 'name', 'status']
      }]
    });
    
    if (!user) throw new Error('Invalid credentials');
    if (user.status !== 'active') throw new Error('Account is not activated');
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    // Check if tenant is active if user is not admin
    if (user.role !== 'admin' && user.Tenant.status !== 'active') {
      throw new Error('Your organization account is not active');
    }

    const token = generateToken(user);
    return { 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
        Tenant: user.Tenant
      }, 
      token 
    };

  } catch (err) {
    logError('login service error', err);
    throw new Error(err.message || 'Login failed. Check your credentials.');
  }
};

/**
 * Activate User Service - Activates user account using activation code
 * @param {String} activationCode - Activation code
 * @param {Number} userId - User ID to activate
 * @returns {Boolean} True if activation succeeded
 */
const activateUser = async (activationCode, userId) => {
  try {
    const { success, message } = await verifyActivationCode(activationCode, userId);
    if (!success) throw new Error(message);

    await User.update({ status: 'active' }, { where: { id: userId } });
    return true;

  } catch (err) {
    logError('activateUser service error', err);
    throw new Error(err.message || 'Activation failed');
  }
};

/**
 * Refresh Token Service - Generates new JWT token
 * @param {String} oldToken - Previous JWT token
 * @returns {Object} Contains new JWT token
 */
const refreshToken = async (oldToken) => {
  try {
    const decoded = jwt.verify(oldToken, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) throw new Error('User not found');
    if (user.status !== 'active') throw new Error('User account is not active');

    const newToken = generateToken(user);
    return { newToken };

  } catch (err) {
    logError('refreshToken service error', err);
    throw new Error(err.message || 'Token refresh failed');
  }
};

/**
 * Reset Password Service - Handles password reset
 * @param {String} email - User email
 * @param {String} newPassword - New password
 * @param {String} resetToken - Password reset token
 * @returns {Boolean} True if password was reset successfully
 */
const resetPassword = async (email, newPassword, resetToken) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User not found');

    // Verify reset token (implementation depends on your reset token system)
    const isValidToken = true; // Replace with actual token verification
    
    if (!isValidToken) throw new Error('Invalid reset token');

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await user.update({ password: hashedPassword });

    return true;

  } catch (err) {
    logError('resetPassword service error', err);
    throw new Error(err.message || 'Password reset failed');
  }
};

/**
 * Request Password Reset Service - Initiates password reset process
 * @param {String} email - User email
 * @returns {Object} Contains reset token and user info
 */
const requestPasswordReset = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User not found');

    // Generate reset token (implementation depends on your system)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      resetToken,
      user: {
        id: user.id,
        email: user.email
      }
    };

  } catch (err) {
    logError('requestPasswordReset service error', err);
    throw new Error(err.message || 'Password reset request failed');
  }
};

module.exports = {
  signUp,
  login,
  activateUser,
  refreshToken,
  resetPassword,
  requestPasswordReset
};