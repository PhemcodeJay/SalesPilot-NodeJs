const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const { sendActivationEmail } = require('./activationCodeService');
const { models, sequelize } = require('../config/db');
const subscriptionService = require('./subscriptionService');

const { User, Tenant, Subscription, ActivationCode } = models;
const { JWT_SECRET, CLIENT_URL } = process.env;

// Email flag
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

const authService = {
  // ✅ Sign Up
  signUp: async (userData, tenantData) => {
    const transaction = await sequelize.transaction();

    try {
      const now = new Date();

      // Create Tenant
      const tenant = await Tenant.create({
        name: tenantData.name,
        email: tenantData.email,
        phone: tenantData.phone,
        address: tenantData.address,
        status: EMAIL_ENABLED ? 'inactive' : 'active',
        subscription_start_date: now,
        subscription_end_date: new Date(now.setFullYear(now.getFullYear() + 1)),
      }, { transaction });

      // Create User
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        tenant_id: tenant.id,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'sales',
        phone: userData.phone,
        location: userData.location,
        status: EMAIL_ENABLED ? 'inactive' : 'active',
      }, { transaction });

      // Create Subscription
      const subscription = await subscriptionService.createSubscription(tenant.id, 'trial', transaction);

      let activationCodeRecord = null;

      if (EMAIL_ENABLED) {
        const activationCode = crypto.randomBytes(20).toString('hex');
        activationCodeRecord = await ActivationCode.create({
          user_id: user.id,
          activation_code: activationCode,
          expires_at: new Date(Date.now() + 60 * 60 * 1000),
          created_at: new Date(),
        }, { transaction });
      }

      await transaction.commit();

      if (EMAIL_ENABLED && activationCodeRecord) {
        await sendActivationEmail(user, activationCodeRecord.activation_code);
      }

      return { tenant, user, subscription, activationCode: activationCodeRecord };
    } catch (err) {
      await transaction.rollback();
      console.error('❌ Error during sign-up:', err);
      throw new Error('Sign-up failed. Please try again.');
    }
  },

  // ✅ Login
  login: async ({ email, password, tenant_id }) => {
    const tenant = await Tenant.findOne({ where: { id: tenant_id } });
    if (!tenant) throw new Error('Tenant not found');

    const user = await User.findOne({ where: { email, tenant_id } });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { userId: user.id, tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { user, token };
  },

  // ✅ Password Reset Request
  passwordResetRequest: async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User with this email does not exist');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.reset_token = resetToken;
    user.reset_token_expiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  },

  // ✅ Password Reset Confirm
  passwordResetConfirm: async (token, newPassword) => {
    const user = await User.findOne({ where: { reset_token: token } });
    if (!user || new Date() > user.reset_token_expiry) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.reset_token = null;
    user.reset_token_expiry = null;
    await user.save();
  },

  // ✅ CRUD: User
  createUser: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await User.create({ ...data, password: hashedPassword });
  },

  getUser: async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');
    return user;
  },

  updateUser: async (id, updates) => {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');
    Object.assign(user, updates);
    await user.save();
    return user;
  },

  deleteUser: async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');
    await user.destroy();
    return { message: 'User deleted successfully' };
  },

  // ✅ CRUD: Tenant
  createTenant: async (data) => {
    return await Tenant.create(data);
  },

  getTenant: async (id) => {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  },

  updateTenant: async (id, updates) => {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new Error('Tenant not found');
    Object.assign(tenant, updates);
    await tenant.save();
    return tenant;
  },

  deleteTenant: async (id) => {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new Error('Tenant not found');
    await tenant.destroy();
    return { message: 'Tenant deleted successfully' };
  },

  // ✅ CRUD: Subscription
  createSubscription: async (data) => {
    return await Subscription.create(data);
  },

  getSubscription: async (id) => {
    const subscription = await Subscription.findByPk(id);
    if (!subscription) throw new Error('Subscription not found');
    return subscription;
  },

  updateSubscription: async (id, updates) => {
    const subscription = await Subscription.findByPk(id);
    if (!subscription) throw new Error('Subscription not found');
    Object.assign(subscription, updates);
    await subscription.save();
    return subscription;
  },

  deleteSubscription: async (id) => {
    const subscription = await Subscription.findByPk(id);
    if (!subscription) throw new Error('Subscription not found');
    await subscription.destroy();
    return { message: 'Subscription deleted successfully' };
  }
};

module.exports = authService;
// Add a session token cookie, verify JWT in a middleware, or auto-login after activation!