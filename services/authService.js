const { User, Tenant, Subscription, ActivationCode } = require('../models');
const { logError, logSecurityEvent } = require('../utils/logger');
const ActivationCodeService = require('./ActivationCodeService');
const SubscriptionService = require('./SubscriptionService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getTenantDb, insertIntoBothDb } = require('../config/db');

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
   * Sign up new user with data in both main and tenant databases
   * @param {Object} mainDbData - Data for main database
   * @param {Object} tenantDbData - Data for tenant database
   * @param {string} [plan='trial'] - Subscription plan
   * @param {Object} [options] - Optional parameters
   * @returns {Promise<Object>} Created entities
   */
  async signUp(
    mainDbData,
    tenantDbData,
    plan = 'trial',
    { transaction = null, ipAddress = null } = {}
  ) {
    const t = transaction || await User.sequelize.transaction();
    let transactionOwner = false;
    
    try {
      if (!transaction) {
        transactionOwner = true;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(mainDbData.password, BCRYPT_SALT_ROUNDS);

      // 1. Create tenant in main DB
      const tenant = await Tenant.create({
        ...tenantDbData.tenant,
        status: 'pending_activation'
      }, { transaction: t });

      // 2. Create user in main DB
      const user = await User.create({
        ...mainDbData,
        password: hashedPassword,
        tenant_id: tenant.id,
        status: this.emailEnabled ? 'pending_activation' : 'active',
        role: 'admin'
      }, { transaction: t });

      // 3. Initialize tenant database and insert data
      const tenantDb = await getTenantDb(`tenant_${tenant.id}`);
      await tenantDb.sequelize.sync();

      // Insert into tenant DB using the shared helper
      await insertIntoBothDb(
        { 
          ...mainDbData, 
          tenant: tenantDbData.tenant,
          password: hashedPassword // Don't forget to hash for tenant DB too
        },
        tenantDbData,
        `tenant_${tenant.id}`,
        { transaction: t }
      );

      // 4. Create subscription
      const subscriptionService = new SubscriptionService(tenant.id);
      const subscription = await subscriptionService.create(plan, { 
        transaction: t, 
        ipAddress 
      });

      // 5. Generate activation if email enabled
      let activationCode = null;
      if (this.emailEnabled) {
        const activationService = new ActivationCodeService(tenant.id);
        activationCode = await activationService.generate({ 
          transaction: t, 
          ipAddress 
        });
      }

      // Commit transaction if we own it
      if (transactionOwner) {
        await t.commit();
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
      // Rollback transaction if we own it
      if (transactionOwner && t) {
        await t.rollback();
      }

      logError('Signup failed', error, {
        operation: 'signUp',
        email: mainDbData.email,
        tenantName: tenantDbData.tenant?.name
      });
      throw error;
    }
  }

  /**
   * Activate user account across both databases
   * @param {string} code - Activation code
   * @param {string} userId - User ID to activate
   * @param {Object} [options] - Optional parameters
   * @returns {Promise<boolean>} True if activation succeeded
   */
  async activateUser(code, userId, { ipAddress = null, transaction = null } = {}) {
    const t = transaction || await User.sequelize.transaction();
    let transactionOwner = false;
    
    try {
      if (!transaction) {
        transactionOwner = true;
      }

      const user = await User.findByPk(userId, {
        include: [{
          model: Tenant,
          attributes: ['id']
        }],
        transaction: t
      });

      if (!user) throw new Error('User not found');
      if (user.status === 'active') throw new Error('Account already active');

      // Verify activation code using the service
      const activationService = new ActivationCodeService(user.Tenant.id);
      const { success, message } = await activationService.verify(code, { 
        transaction: t,
        ipAddress 
      });

      if (!success) throw new Error(message);

      // Get tenant DB connection
      const tenantDb = await getTenantDb(`tenant_${user.tenant_id}`);

      // Update both databases in parallel
      await Promise.all([
        // Main DB updates
        user.update({ status: 'active' }, { transaction: t }),
        Tenant.update({ status: 'active' }, { 
          where: { id: user.tenant_id },
          transaction: t 
        }),
        
        // Tenant DB updates
        tenantDb.models.User.update(
          { status: 'active' },
          { 
            where: { main_db_user_id: userId },
            transaction: t 
          }
        )
      ]);

      if (transactionOwner) {
        await t.commit();
      }

      logSecurityEvent('user_activated', {
        userId: user.id,
        tenantId: user.tenant_id,
        ipAddress
      });

      return true;

    } catch (error) {
      if (transactionOwner && t) {
        await t.rollback();
      }

      logError('Activation failed', error, {
        operation: 'activateUser',
        userId,
        ipAddress
      });
      throw error;
    }
  }

  /**
   * Authenticate user with tenant context
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} [options] - Optional parameters
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
          },
          {
            model: ActivationCode,
            where: { used_at: null, expires_at: { [User.sequelize.Op.gt]: new Date() } },
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
          subscription: user.Subscriptions ? user.Subscriptions[0] : null,
          pendingActivation: user.ActivationCodes ? user.ActivationCodes.length > 0 : false
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

  // ... (other methods like refreshToken, requestPasswordReset, etc.)
}

module.exports = new AuthService();