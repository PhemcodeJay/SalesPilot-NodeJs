const bcryptUtils = require('../utils/bcryptUtils');
const { executeQuery } = require('../config/db');
const crypto = require('crypto');
const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure Sequelize instance is correctly imported

// Define User model using Sequelize
class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenant_id: { type: DataTypes.INTEGER, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('sales', 'admin', 'manager'), defaultValue: 'sales' },
    activation_token: { type: DataTypes.STRING, allowNull: true },
    reset_token: { type: DataTypes.STRING, allowNull: true },
    reset_token_expiry: { type: DataTypes.DATE, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'user',
    tableName: 'users',
    timestamps: false,
  }
);

class UserModel {
  /**
   * Register a new user with a tenant and subscription
   */
  static async signup(userData, tenantDomain = 'localhost') {
    try {
      const {
        username,
        email,
        phone,
        password,
        confirm_password,
        location,
        role = 'sales',
        subscription_plan = 'trial',
        tenant_name,
      } = userData;

      if (!username || !email || !password || !confirm_password || !location || !tenant_name) {
        throw new Error('Missing required fields.');
      }

      if (password !== confirm_password) {
        throw new Error('Passwords do not match.');
      }

      const validRoles = ['sales', 'admin', 'manager'];
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role selected.');
      }

      const existingUser = await executeQuery(`SELECT * FROM users WHERE email = ?`, [email]);
      if (existingUser.length > 0) {
        throw new Error('User already exists.');
      }

      // Find or create tenant
      let tenant = await executeQuery(`SELECT * FROM tenants WHERE name = ?`, [tenant_name]);
      let tenantId = tenant.length ? tenant[0].id : await this.createTenant(tenant_name, email, phone, location, subscription_plan);

      const hashedPassword = await bcryptUtils.hashPassword(password);
      const activation_token = crypto.randomBytes(32).toString('hex');

      // Insert user
      const userResult = await executeQuery(
        `INSERT INTO users (username, email, phone, password, location, role, tenant_id, activation_token, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, phone, hashedPassword, location, role, tenantId, activation_token, 0]
      );

      if (!userResult.insertId) {
        throw new Error('Failed to create user.');
      }

      // Create a subscription
      await this.createSubscription(userResult.insertId, tenantId, subscription_plan);

      return { success: true, message: 'User registered. Activation email sent.', activation_token };
    } catch (error) {
      console.error('Signup Error:', error);
      throw new Error('Signup failed. Please try again.');
    }
  }

  /**
   * Create a new tenant
   */
  static async createTenant(name, email, phone, location, subscriptionPlan) {
    const tenantInsert = await executeQuery(
      `INSERT INTO tenants (name, email, phone, address, status, subscription_type, subscription_start_date, subscription_end_date)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY))`,
      [name, email, phone, location, 'inactive', subscriptionPlan]
    );
    return tenantInsert.insertId;
  }

  /**
   * Create a subscription
   */
  static async createSubscription(userId, tenantId, subscriptionPlan, duration = 30) {
    return executeQuery(
      `INSERT INTO subscriptions (user_id, tenant_id, subscription_plan, start_date, end_date, is_free_trial_used)
       VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?)`,
      [userId, tenantId, subscriptionPlan, duration, false]
    );
  }

  /**
   * Login user
   */
  static async login(email, password, tenantDomain = 'localhost') {
    try {
      const user = await executeQuery(`SELECT * FROM users WHERE email = ?`, [email]);
      if (!user.length) throw new Error('User not found.');

      const isMatch = await bcryptUtils.comparePassword(password, user[0].password);
      if (!isMatch) throw new Error('Invalid credentials.');

      if (!user[0].is_active) throw new Error('Account not activated. Check email.');

      return { success: true, user: user[0] };
    } catch (error) {
      console.error('Login Error:', error);
      throw new Error('Login failed. Check credentials.');
    }
  }

  /**
   * Request email reset
   */
  static async requestEmailReset(userId, newEmail, tenantDomain = 'localhost') {
    try {
      const emailResetToken = crypto.randomBytes(32).toString('hex');

      await executeQuery(
        `UPDATE users SET email_reset_token = ?, new_email = ? WHERE id = ?`, 
        [emailResetToken, newEmail, userId]
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
      const user = await executeQuery(
        `SELECT id, new_email FROM users WHERE email_reset_token = ?`, 
        [emailResetToken]
      );

      if (!user.length) throw new Error('Invalid email reset token.');

      await executeQuery(
        `UPDATE users SET email = ?, email_reset_token = NULL, new_email = NULL WHERE id = ?`, 
        [user[0].new_email, user[0].id]
      );

      return { success: true, message: 'Email updated successfully.' };
    } catch (error) {
      console.error('Email Reset Confirmation Error:', error);
      throw new Error('Email reset confirmation failed.');
    }
  }
}

module.exports = UserModel;
