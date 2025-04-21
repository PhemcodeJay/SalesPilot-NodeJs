const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const { models, sequelize } = require('../config/db');
const subscriptionService = require('./subscriptionService');

const { User, Tenant, ActivationCode } = models;
const { EMAIL_ENABLED, JWT_SECRET, CLIENT_URL, BASE_URL } = process.env;

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
        status: EMAIL_ENABLED ? 'inactive' : 'active', // inactive in prod
        subscription_start_date: now,
        subscription_end_date: new Date(now.setMonth(now.getMonth() + 3)), // 3-month trial
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
        status: EMAIL_ENABLED ? 'inactive' : 'active', // Inactive if in prod mode
      }, { transaction });

      // Create Subscription
      const subscription = await subscriptionService.createSubscription(tenant.id, 'trial', transaction);

      let activationCodeRecord = null;

      if (EMAIL_ENABLED) {
        // Generate an activation code in production mode
        const activationCode = crypto.randomBytes(20).toString('hex');
        activationCodeRecord = await ActivationCode.create({
          user_id: user.id,
          activation_code: activationCode,
          expires_at: new Date(Date.now() + 60 * 60 * 1000), // Code expires in 1 hour
          created_at: new Date(),
        }, { transaction });

        // Send activation email
        await sendActivationEmail(user.email, activationCode);
      }

      // In development mode, automatically activate the user
      if (!EMAIL_ENABLED) {
        user.status = 'active'; // Auto-activate user in dev mode
        await user.save();
      }

      await transaction.commit();

      // Return the subscription data along with tenant and user
      return { tenant, user, subscription, activationCode: activationCodeRecord ? activationCodeRecord.activation_code : null };
    } catch (err) {
      await transaction.rollback();
      console.error('❌ Error during sign-up:', err);
      throw new Error('Sign-up failed. Please try again.');
    }
  },
  
  // ✅ Login
  login: async (email, password) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      if (user.status !== 'active') {
        throw new Error('User account is inactive');
      }

      // Generate JWT token
      const payload = { userId: user.id, tenantId: user.tenant_id };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      return { token, user };
    } catch (err) {
      console.error('❌ Login Error:', err);
      throw new Error('Login failed. Please try again.');
    }
  },

  // ✅ Request Password Reset
  requestPasswordReset: async (email) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate reset token and expiration time
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetTokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.reset_token = resetToken;
      user.reset_token_expiry = resetTokenExpiration;
      await user.save();

      // Send password reset email
      await sendPasswordResetEmail(user);

      return { message: 'Password reset email sent' };
    } catch (err) {
      console.error('❌ Password Reset Request Error:', err);
      throw new Error('Failed to request password reset');
    }
  },

  // ✅ Reset Password Execution
  resetPassword: async (token, newPassword) => {
    try {
      const user = await User.findOne({ where: { reset_token: token, reset_token_expiry: { [Op.gt]: new Date() } } });
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.reset_token = null;
      user.reset_token_expiry = null;
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (err) {
      console.error('❌ Password Reset Error:', err);
      throw new Error('Failed to reset password');
    }
  },

  // ✅ Refresh Token (to refresh JWT token)
  refreshToken: async (oldToken) => {
    try {
      const decoded = jwt.verify(oldToken, JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      const newToken = jwt.sign({ userId: user.id, tenantId: user.tenant_id }, JWT_SECRET, { expiresIn: '1h' });
      return { newToken };
    } catch (err) {
      console.error('❌ Refresh Token Error:', err);
      throw new Error('Failed to refresh token');
    }
  },

  // ✅ Update User Profile
  updateProfile: async (userId, updateData) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update(updateData);
      return { message: 'Profile updated successfully', user };
    } catch (err) {
      console.error('❌ Update Profile Error:', err);
      throw new Error('Failed to update profile');
    }
  },

  // ✅ Delete User (Soft delete by setting status to 'deleted')
  deleteUser: async (userId) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.status = 'deleted';
      await user.save();
      return { message: 'User deleted successfully' };
    } catch (err) {
      console.error('❌ Delete User Error:', err);
      throw new Error('Failed to delete user');
    }
  },

};

module.exports = authService;
