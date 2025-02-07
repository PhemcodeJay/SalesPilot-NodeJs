const bcryptUtils = require('../utils/bcryptUtils');
const { executeQuery } = require('../config/db');
const crypto = require('crypto');

class UserModel {
  /**
   * Sign up a new user
   */
  static async signup(userData, tenantDomain = 'localhost') {
    try {
      const { username, email, phone, password, confirm_password, location, role = 'sales', subscription_plan = 'trial' } = userData;

      if (!username || !email || !password || !confirm_password || !location) {
        throw new Error('Missing required fields.');
      }

      if (password !== confirm_password) {
        throw new Error('Passwords do not match.');
      }

      const validRoles = ['sales', 'admin', 'manager'];
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role selected.');
      }

      const existingUser = await this.findOne({ where: { email } }, tenantDomain);
      if (existingUser) {
        throw new Error('User already exists.');
      }

      const hashedPassword = await bcryptUtils.hashPassword(password);
      const activation_token = crypto.randomBytes(32).toString('hex');

      // Insert user
      const userResult = await executeQuery(`
        INSERT INTO users (username, email, phone, password, location, role, tenant_domain, activation_token, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [username, email, phone, hashedPassword, location, role, tenantDomain, activation_token, 0]
      );

      if (!userResult.insertId) {
        throw new Error('Failed to create user.');
      }

      const userId = userResult.insertId;
      const subscriptionDuration = 30; // Configurable duration

      // Subscription
      await executeQuery(`
        INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, is_free_trial_used, tenant_domain)
        VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?)`, 
        [userId, subscription_plan, subscriptionDuration, false, tenantDomain]
      );

      return { success: true, message: 'User registered. Activation email sent.', activation_token };
    } catch (error) {
      console.error('Signup Error:', error);
      throw new Error('Signup failed. Please try again.');
    }
  }

  /**
   * Login user
   */
  static async login(email, password, tenantDomain = 'localhost') {
    try {
      const user = await this.findOne({ where: { email } }, tenantDomain);
      if (!user) throw new Error('User not found.');

      const isMatch = await bcryptUtils.comparePassword(password, user.password);
      if (!isMatch) throw new Error('Invalid credentials.');

      if (!user.is_active) throw new Error('Account not activated. Check email.');

      return { success: true, user };
    } catch (error) {
      console.error('Login Error:', error);
      throw new Error('Login failed. Check credentials.');
    }
  }

  /**
   * Activate account
   */
  static async activateAccount(activation_token, tenantDomain = 'localhost') {
    try {
      const user = await executeQuery(`SELECT id FROM users WHERE activation_token = ? AND tenant_domain = ?`, [activation_token, tenantDomain]);

      if (!user.length) throw new Error('Invalid or expired activation token.');

      await executeQuery(`UPDATE users SET is_active = 1, activation_token = NULL WHERE id = ?`, [user[0].id]);

      return { success: true, message: 'Account activated successfully.' };
    } catch (error) {
      console.error('Account Activation Error:', error);
      throw new Error('Account activation failed.');
    }
  }

  /**
   * Generate password reset token
   */
  static async requestPasswordReset(email, tenantDomain = 'localhost') {
    try {
      const user = await this.findOne({ where: { email } }, tenantDomain);
      if (!user) throw new Error('Email not found.');

      const reset_token = crypto.randomBytes(32).toString('hex');
      await executeQuery(`
        UPDATE users SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?`, 
        [reset_token, email]
      );

      return { success: true, message: 'Password reset link sent.', reset_token };
    } catch (error) {
      console.error('Password Reset Request Error:', error);
      throw new Error('Password reset request failed.');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(reset_token, newPassword) {
    try {
      const user = await executeQuery(`SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()`, [reset_token]);
      if (!user.length) throw new Error('Invalid or expired reset token.');

      const hashedPassword = await bcryptUtils.hashPassword(newPassword);
      await executeQuery(`UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`, 
        [hashedPassword, user[0].id]
      );

      return { success: true, message: 'Password reset successful.' };
    } catch (error) {
      console.error('Password Reset Error:', error);
      throw new Error('Password reset failed.');
    }
  }

  /**
   * Request email reset
   */
  static async requestEmailReset(userId, newEmail, tenantDomain = 'localhost') {
    try {
      const emailResetToken = crypto.randomBytes(32).toString('hex');

      await executeQuery(`
        UPDATE users SET email_reset_token = ?, new_email = ? WHERE id = ? AND tenant_domain = ?`, 
        [emailResetToken, newEmail, userId, tenantDomain]
      );

      return { success: true, message: 'Email reset request sent.', emailResetToken };
    } catch (error) {
      console.error('Email Reset Request Error:', error);
      throw new Error('Email reset request failed.');
    }
  }

  /**
   * Confirm email reset
   */
  static async confirmEmailReset(emailResetToken, tenantDomain = 'localhost') {
    try {
      const user = await executeQuery(`SELECT id, new_email FROM users WHERE email_reset_token = ? AND tenant_domain = ?`, [emailResetToken, tenantDomain]);

      if (!user.length) throw new Error('Invalid email reset token.');

      await executeQuery(`UPDATE users SET email = ?, email_reset_token = NULL, new_email = NULL WHERE id = ?`, 
        [user[0].new_email, user[0].id]
      );

      return { success: true, message: 'Email updated successfully.' };
    } catch (error) {
      console.error('Email Reset Confirmation Error:', error);
      throw new Error('Email reset confirmation failed.');
    }
  }

  /**
   * Find a user by a field
   */
  static async findOne(query, tenantDomain = 'localhost') {
    try {
      if (!query || !query.where) throw new Error('Invalid query object.');

      const field = Object.keys(query.where)[0];
      const value = query.where[field];
      const allowedFields = ['id', 'username', 'email', 'phone', 'activation_token', 'reset_token'];

      if (!allowedFields.includes(field)) {
        throw new Error(`Invalid query field: ${field}`);
      }

      const results = await executeQuery(`SELECT * FROM users WHERE ${field} = ? AND tenant_domain = ?`, [value, tenantDomain]);

      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('FindOne Error:', error);
      throw new Error('User lookup failed.');
    }
  }
}

module.exports = UserModel;
