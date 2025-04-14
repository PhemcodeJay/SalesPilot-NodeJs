const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const { JWT_SECRET } = process.env;

const User = require('../models/user');
const Tenant = require('../models/tenants');
const Subscription = require('../models/subscription');
const { generateToken } = require('../config/auth');

module.exports = {
  // SignUp
  async signUp({ username, email, password, phone, location }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    const tenant = await Tenant.create({
      name: `${username}'s Business`,
      email,
      subscription_start_date: startDate,
      subscription_end_date: endDate,
    });

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      location,
      tenant_id: tenant.id,
    });

    const subscription = await Subscription.create({
      user_id: user.id,
      subscription_plan: 'trial',
      start_date: startDate,
      end_date: endDate,
    });

    const token = generateToken(user);
    return { user, token };
  },

  // Login
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

  // Password Reset Request
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

  // Password Reset Confirm
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

  // Create User (CRUD)
  async createUser({ username, email, password, phone, location, tenant_id }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      location,
      tenant_id,
    });

    return user;
  },

  // Get User (CRUD)
  async getUser(id) {
    const user = await User.findOne({ where: { id } });
    if (!user) throw new Error('User not found');
    return user;
  },

  // Update User (CRUD)
  async updateUser(id, { username, email, phone, location }) {
    const user = await User.findOne({ where: { id } });
    if (!user) throw new Error('User not found');

    user.username = username || user.username;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.location = location || user.location;

    await user.save();
    return user;
  },

  // Delete User (CRUD)
  async deleteUser(id) {
    const user = await User.findOne({ where: { id } });
    if (!user) throw new Error('User not found');

    await user.destroy();
    return { message: 'User deleted successfully' };
  },

  // Create Tenant (CRUD)
  async createTenant({ name, email, subscription_start_date, subscription_end_date }) {
    const tenant = await Tenant.create({
      name,
      email,
      subscription_start_date,
      subscription_end_date,
    });

    return tenant;
  },

  // Get Tenant (CRUD)
  async getTenant(id) {
    const tenant = await Tenant.findOne({ where: { id } });
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  },

  // Update Tenant (CRUD)
  async updateTenant(id, { name, email, subscription_start_date, subscription_end_date }) {
    const tenant = await Tenant.findOne({ where: { id } });
    if (!tenant) throw new Error('Tenant not found');

    tenant.name = name || tenant.name;
    tenant.email = email || tenant.email;
    tenant.subscription_start_date = subscription_start_date || tenant.subscription_start_date;
    tenant.subscription_end_date = subscription_end_date || tenant.subscription_end_date;

    await tenant.save();
    return tenant;
  },

  // Delete Tenant (CRUD)
  async deleteTenant(id) {
    const tenant = await Tenant.findOne({ where: { id } });
    if (!tenant) throw new Error('Tenant not found');

    await tenant.destroy();
    return { message: 'Tenant deleted successfully' };
  },

  // Create Subscription (CRUD)
  async createSubscription({ user_id, subscription_plan, start_date, end_date }) {
    const subscription = await Subscription.create({
      user_id,
      subscription_plan,
      start_date,
      end_date,
    });

    return subscription;
  },

  // Get Subscription (CRUD)
  async getSubscription(id) {
    const subscription = await Subscription.findOne({ where: { id } });
    if (!subscription) throw new Error('Subscription not found');
    return subscription;
  },

  // Update Subscription (CRUD)
  async updateSubscription(id, { subscription_plan, start_date, end_date }) {
    const subscription = await Subscription.findOne({ where: { id } });
    if (!subscription) throw new Error('Subscription not found');

    subscription.subscription_plan = subscription_plan || subscription.subscription_plan;
    subscription.start_date = start_date || subscription.start_date;
    subscription.end_date = end_date || subscription.end_date;

    await subscription.save();
    return subscription;
  },

  // Delete Subscription (CRUD)
  async deleteSubscription(id) {
    const subscription = await Subscription.findOne({ where: { id } });
    if (!subscription) throw new Error('Subscription not found');

    await subscription.destroy();
    return { message: 'Subscription deleted successfully' };
  }
};
