const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const { JWT_SECRET } = process.env;

const User = require('../models/user');
const Tenant = require('../models/tenants');
const Subscription = require('../models/subscription');
const { generateToken } = require('../config/auth');

const { sendActivationEmail } = require('../services/activationCodeService');
const { createSubscription } = require('../services/subscriptionService');

const authService = {
  // ✅ Sign Up
  async signUp({ username, email, password, phone, location }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      // Step 1: Create Tenant
      const tenant = await Tenant.create({
        name: `${username}'s Business`,
        email,
        subscription_start_date: startDate,
        subscription_end_date: endDate,
      });

      // Step 2: Create User
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        phone,
        location,
        tenant_id: tenant.id,
      });

      // Step 3: Create Subscription
      await createSubscription(tenant.id, 'trial');

      // Step 4: Send Activation Email
      await sendActivationEmail(user);

      const token = generateToken(user);
      return { user, token };
    } catch (err) {
      console.error('❌ Sign-up error:', err.message);
      throw new Error('Sign-up failed');
    }
  },

  // ✅ Login
  async login({ email, password, tenant_id }) {
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
  async passwordResetRequest(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User with this email does not exist');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    user.reset_token = resetToken;
    user.reset_token_expiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  },

  // ✅ Password Reset Confirm
  async passwordResetConfirm(token, newPassword) {
    const user = await User.findOne({ where: { reset_token: token } });
    if (!user) throw new Error('Invalid or expired reset token');

    if (new Date() > user.reset_token_expiry) {
      throw new Error('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.reset_token = null;
    user.reset_token_expiry = null;
    await user.save();
  },

  // ✅ CRUD: User
  async createUser({ username, email, password, phone, location, tenant_id }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await User.create({ username, email, password: hashedPassword, phone, location, tenant_id });
  },

  async getUser(id) {
    const user = await User.findOne({ where: { id } });
    if (!user) throw new Error('User not found');
    return user;
  },

  async updateUser(id, updates) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');

    Object.assign(user, updates);
    await user.save();
    return user;
  },

  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');

    await user.destroy();
    return { message: 'User deleted successfully' };
  },

  // ✅ CRUD: Tenant
  async createTenant({ name, email, subscription_start_date, subscription_end_date }) {
    return await Tenant.create({ name, email, subscription_start_date, subscription_end_date });
  },

  async getTenant(id) {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  },

  async updateTenant(id, updates) {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new Error('Tenant not found');

    Object.assign(tenant, updates);
    await tenant.save();
    return tenant;
  },

  async deleteTenant(id) {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new Error('Tenant not found');

    await tenant.destroy();
    return { message: 'Tenant deleted successfully' };
  },

  // ✅ CRUD: Subscription
  async createSubscription({ user_id, subscription_plan, start_date, end_date }) {
    return await Subscription.create({ user_id, subscription_plan, start_date, end_date });
  },

  async getSubscription(id) {
    const subscription = await Subscription.findByPk(id);
    if (!subscription) throw new Error('Subscription not found');
    return subscription;
  },

  async updateSubscription(id, updates) {
    const subscription = await Subscription.findByPk(id);
    if (!subscription) throw new Error('Subscription not found');

    Object.assign(subscription, updates);
    await subscription.save();
    return subscription;
  },

  async deleteSubscription(id) {
    const subscription = await Subscription.findByPk(id);
    if (!subscription) throw new Error('Subscription not found');

    await subscription.destroy();
    return { message: 'Subscription deleted successfully' };
  }
};

module.exports = authService;
