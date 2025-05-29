const { User, Tenant, Subscription, ActivationCode } = require('../models'); // Main DB models
const { logError, logSecurityEvent } = require('../utils/logger');
const ActivationCodeService = require('./ActivationCodeService');
const SubscriptionService = require('./SubscriptionService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getTenantDb } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

class AuthService {
  constructor() {
    this.emailEnabled = process.env.EMAIL_ENABLED === 'true';
  }

  /**
   * Generate JWT token for authenticated user
   * @private
   */
  _generateToken(user) {
    const payload = { 
      id: user.id, 
      email: user.email, 
      tenant_id: user.tenant_id,
      role: user.role 
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  }

  /**
   * Sign up new user and tenant
   * @param {Object} userData - User information
   * @param {Object} tenantData - Tenant information
   * @param {string} [plan='trial'] - Subscription plan
   * @param {Object} [options] - Optional parameters
   * @param {Object} [options.transaction] - Sequelize transaction
   * @param {string} [options.ipAddress] - IP address for security logging
   * @returns {Promise<Object>} Created user, tenant, and subscription
   */
  async signUp(userData, tenantData, plan = 'trial', { transaction = null, ipAddress = null } = {}) {
    const t = transaction || null;
    
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, BCRYPT_SALT_ROUNDS);

      // Create tenant
      const tenant = await Tenant.create({
        ...tenantData,
        status: 'pending_activation'
      }, { transaction: t });

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        tenant_id: tenant.id,
        status: this.emailEnabled ? 'pending_activation' : 'active',
        role: 'admin' // First user is always admin
      }, { transaction: t });

      // Initialize tenant database
      const tenantDb = await getTenantDb(`tenant_${tenant.id}`);
      await tenantDb.sync();

      // Create subscription
      const subscriptionService = new SubscriptionService(tenant.id);
      const subscription = await subscriptionService.create(plan, { 
        transaction: t, 
        ipAddress 
      });

      // Generate activation if email enabled
      let activationCode = null;
      if (this.emailEnabled) {
        const activationService = new ActivationCodeService(tenant.id);
        activationCode = await activationService.generate({ 
          transaction: t, 
          ipAddress 
        });
      }

      logSecurityEvent('user_signup', {
        userId: user.id,
        tenantId: tenant.id,
        plan,
        ipAddress
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          status: tenant.status
        },
        subscription: {
          id: subscription.id,
          plan: subscription.subscription_plan,
          status: subscription.status
        },
        activationCode,
        redirectPath: this.emailEnabled ? '/auth/activate' : null
      };

    } catch (error) {
      logError('Signup failed', error, {
        operation: 'signUp',
        email: userData.email,
        tenantName: tenantData.name
      });
      throw error;
    }
  }

  /**
   * Authenticate user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} [options] - Optional parameters
   * @param {string} [options.ipAddress] - IP address for security logging
   * @returns {Promise<Object>} User data and JWT token
   */
  async login(email, password, { ipAddress = null } = {}) {
    try {
      const user = await User.findOne({ 
        where: { email },
        include: [
          {
            model: Tenant,
            attributes: ['id', 'name', 'status']
          },
          {
            model: Subscription,
            where: { status: 'Active' },
            required: false,
            order: [['created_at', 'DESC']],
            limit: 1
          }
        ]
      });
      
      if (!user) throw new Error('Invalid credentials');
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error('Invalid credentials');

      // Check account status
      if (user.status !== 'active') {
        throw new Error(
          user.status === 'pending_activation' 
            ? 'Account requires activation' 
            : 'Account is suspended'
        );
      }

      // Check tenant status for non-admin users
      if (user.role !== 'admin' && user.Tenant.status !== 'active') {
        throw new Error('Organization account is not active');
      }

      // Check subscription for non-admin users
      if (user.role !== 'admin' && (!user.Subscriptions || user.Subscriptions.length === 0)) {
        throw new Error('No active subscription found');
      }

      const token = this._generateToken(user);

      logSecurityEvent('user_login', {
        userId: user.id,
        tenantId: user.tenant_id,
        ipAddress
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: user.tenant_id,
          Tenant: user.Tenant,
          subscription: user.Subscriptions ? user.Subscriptions[0] : null
        },
        token
      };

    } catch (error) {
      logError('Login failed', error, {
        operation: 'login',
        email,
        ipAddress
      });
      throw error;
    }
  }

  /**
   * Activate user account
   * @param {string} code - Activation code
   * @param {string} userId - User ID to activate
   * @param {Object} [options] - Optional parameters
   * @param {string} [options.ipAddress] - IP address for security logging
   * @returns {Promise<boolean>} True if activation succeeded
   */
  async activateUser(code, userId, { ipAddress = null } = {}) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Tenant,
          attributes: ['id']
        }]
      });

      if (!user) throw new Error('User not found');
      if (user.status === 'active') throw new Error('Account already active');

      const activationService = new ActivationCodeService(user.Tenant.id);
      const { success, message, user: verifiedUser } = await activationService.verify(code, { ipAddress });

      if (!success) throw new Error(message);

      // Update user and tenant status
      await Promise.all([
        user.update({ status: 'active' }),
        Tenant.update({ status: 'active' }, { where: { id: user.tenant_id } })
      ]);

      logSecurityEvent('user_activated', {
        userId: user.id,
        tenantId: user.tenant_id,
        ipAddress
      });

      return true;

    } catch (error) {
      logError('Activation failed', error, {
        operation: 'activateUser',
        userId,
        ipAddress
      });
      throw error;
    }
  }

  /**
   * Refresh JWT token
   * @param {string} token - Current JWT token
   * @returns {Promise<Object>} New token and user data
   */
  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'name', 'role', 'tenant_id', 'status'],
        include: [{
          model: Tenant,
          attributes: ['id', 'name', 'status']
        }]
      });
      
      if (!user) throw new Error('User not found');
      if (user.status !== 'active') throw new Error('User account is not active');

      const newToken = this._generateToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: user.tenant_id,
          Tenant: user.Tenant
        },
        newToken
      };

    } catch (error) {
      logError('Token refresh failed', error, {
        operation: 'refreshToken'
      });
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<string>} Reset token
   */
  async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error('User not found');

      const resetToken = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET + user.password, // Include password hash in secret to invalidate when password changes
        { expiresIn: '1h' }
      );

      logSecurityEvent('password_reset_requested', {
        userId: user.id,
        tenantId: user.tenant_id
      });

      return resetToken;

    } catch (error) {
      logError('Password reset request failed', error, {
        operation: 'requestPasswordReset',
        email
      });
      throw error;
    }
  }

  /**
   * Reset user password
   * @param {string} resetToken - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if password was reset
   */
  async resetPassword(resetToken, newPassword) {
    try {
      // Find user without verifying token first to get current password
      const decoded = jwt.decode(resetToken);
      if (!decoded || !decoded.id) throw new Error('Invalid token');

      const user = await User.findByPk(decoded.id);
      if (!user) throw new Error('User not found');

      // Now verify with user's current password in secret
      jwt.verify(resetToken, JWT_SECRET + user.password);

      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      await user.update({ password: hashedPassword });

      logSecurityEvent('password_reset', {
        userId: user.id,
        tenantId: user.tenant_id
      });

      return true;

    } catch (error) {
      logError('Password reset failed', error, {
        operation: 'resetPassword'
      });
      throw error;
    }
  }
}

module.exports = new AuthService();