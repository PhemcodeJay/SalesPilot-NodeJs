const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const { JWT_SECRET } = process.env;
const { sendActivationEmail } = require('./activationCodeService');
const { createSubscription } = require('./subscriptionService');
const User = require('../models/user');
const Tenant = require('../models/tenants');
const Subscription = require('../models/subscription');
const { Op } = require('sequelize'); // Added Sequelize operator import

const authService = {
  // ✅ Sign Up
  signUp: async (userData, tenantData) => {
    // Create Tenant
    const tenant = await Tenant.create({
      name: tenantData.name,
      email: tenantData.email,
      phone: tenantData.phone,
      address: tenantData.address,
      status: 'inactive',  // Start as inactive
      subscription_start_date: new Date(),
      subscription_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),  // Default 1-year subscription
    });
  
    // Create User
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
      tenant_id: tenant.id,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'sales',  // Default to 'sales' role
      phone: userData.phone,
      location: userData.location,
    });
  
    // Create Subscription (Trial by default)
    await createSubscription(tenant.id, 'trial');  // Default to trial plan
  
    // Send Activation Email
    await sendActivationEmail(user);
  
    return { user, tenant };
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
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    user.reset_token = resetToken;
    user.reset_token_expiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  },

  // ✅ Password Reset Confirm
  passwordResetConfirm: async (token, newPassword) => {
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
  createUser: async ({ username, email, password, phone, location, tenant_id }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await User.create({ username, email, password: hashedPassword, phone, location, tenant_id });
  },

  getUser: async (id) => {
    const user = await User.findOne({ where: { id } });
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
  createTenant: async ({ name, email, subscription_start_date, subscription_end_date }) => {
    return await Tenant.create({ name, email, subscription_start_date, subscription_end_date });
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
  createSubscription: async ({ user_id, subscription_plan, start_date, end_date }) => {
    return await Subscription.create({ user_id, subscription_plan, start_date, end_date });
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
