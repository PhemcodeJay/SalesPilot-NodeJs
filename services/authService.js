const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const { models, sequelize } = require('../config/db');
const subscriptionService = require('./subscriptionService');
const passwordResetService = require('./passwordresetService');

const { User, Tenant, ActivationCode } = models;
const { EMAIL_ENABLED, JWT_SECRET } = process.env;

// Helper function to get status based on email enabled flag
const getStatus = () => EMAIL_ENABLED ? 'inactive' : 'active';

const authService = {
  // ✅ Sign Up
  signUp: async (userData, tenantData) => {
    const transaction = await sequelize.transaction();
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 3); // Subscription trial period (3 months)

      console.log('📌 Creating tenant...');
      const tenant = await Tenant.create({
        name: tenantData.name,
        email: tenantData.email,
        phone: tenantData.phone,
        address: tenantData.address,
        status: getStatus(),
        subscription_start_date: now,
        subscription_end_date: endDate,
      }, { transaction });
      console.log('✅ Tenant created with ID:', tenant.id);

      console.log('📌 Hashing password...');
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      console.log('📌 Creating user...');
      const user = await User.create({
        tenant_id: tenant.id,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'sales',
        phone: userData.phone,
        location: userData.location,
        status: getStatus(),
      }, { transaction });
      console.log('✅ User created with ID:', user.id);

      console.log('📌 Creating subscription...');
      const subscription = await subscriptionService.createSubscription(tenant.id, 'trial', transaction);
      console.log('✅ Subscription created with ID:', subscription.id);

      let activationCodeRecord = null;

      if (EMAIL_ENABLED) {
        console.log('📌 Generating activation code...');
        const activationCode = crypto.randomBytes(20).toString('hex');
        activationCodeRecord = await ActivationCode.create({
          user_id: user.id,
          activation_code: activationCode,
          expires_at: new Date(Date.now() + 60 * 60 * 1000),
          created_at: new Date(),
        }, { transaction });
        console.log('✅ Activation code generated.');

        console.log('📤 Sending activation email...');
        await sendActivationEmail(user.email, activationCode);
        console.log('✅ Activation email sent.');
      } else {
        console.log('⚙️ Dev mode: auto-activating user...');
        user.status = 'active';
        await user.save({ transaction });
        console.log('✅ User auto-activated.');
      }

      await transaction.commit();
      console.log('✅ Sign-up transaction committed.');

      return {
        tenant,
        user,
        subscription,
        activationCode: activationCodeRecord ? activationCodeRecord.activation_code : null
      };

    } catch (err) {
      console.error('❌ Sign-up error:', err.message);
      if (err.errors) {
        err.errors.forEach(e => console.error('Validation error:', e.message));
      }
      await transaction.rollback();
      throw new Error('Sign-up failed. Please check logs for details.');
    }
  },

  // ✅ Login
  login: async (email, password) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error('User not found');

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error('Invalid credentials');

      if (user.status !== 'active') throw new Error('User account is inactive');

      const payload = { userId: user.id, tenantId: user.tenant_id };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      return { token, user };
    } catch (err) {
      console.error('❌ Login Error:', err.message);
      throw new Error('Login failed');
    }
  },

  // ✅ Request Password Reset
  requestPasswordReset: async (email) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error('User not found');

      const { code: resetToken } = await passwordResetService.generateResetToken(user.id);
      await sendPasswordResetEmail(user, resetToken);

      return { message: 'Password reset email sent' };
    } catch (err) {
      console.error('❌ Password Reset Request Error:', err.message);
      throw new Error('Failed to request password reset');
    }
  },

  // ✅ Reset Password
  resetPassword: async (token, newPassword) => {
    try {
      const reset = await passwordResetService.verifyResetToken(token);
      if (!reset) throw new Error('Invalid or expired reset token');

      const user = await User.findByPk(reset.user_id);
      if (!user) throw new Error('User not found');

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.reset_token = null;
      user.reset_token_expiry = null;
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (err) {
      console.error('❌ Password Reset Error:', err.message);
      throw new Error('Failed to reset password');
    }
  },

  // ✅ Refresh Token
  refreshToken: async (oldToken) => {
    try {
      const decoded = jwt.verify(oldToken, JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      if (!user) throw new Error('User not found');

      const newToken = jwt.sign({ userId: user.id, tenantId: user.tenant_id }, JWT_SECRET, { expiresIn: '1h' });
      return { newToken };
    } catch (err) {
      console.error('❌ Refresh Token Error:', err.message);
      throw new Error('Failed to refresh token');
    }
  },

  // ✅ Update Profile
  updateProfile: async (userId, updateData) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      await user.update(updateData);
      return { message: 'Profile updated successfully', user };
    } catch (err) {
      console.error('❌ Update Profile Error:', err.message);
      throw new Error('Failed to update profile');
    }
  },

  // ✅ Delete User
  deleteUser: async (userId) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      user.status = 'deleted';
      await user.save();
      return { message: 'User deleted successfully' };
    } catch (err) {
      console.error('❌ Delete User Error:', err.message);
      throw new Error('Failed to delete user');
    }
  },
};

module.exports = authService;
