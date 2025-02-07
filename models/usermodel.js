const bcryptUtils = require('../utils/bcryptUtils');
const { executeQuery } = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class UserModel {

  /**
   * Send an email using nodemailer
   * @param {String} to - Recipient email
   * @param {String} subject - Email subject
   * @param {String} html - Email body
   */
  static async sendEmail(to, subject, html) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"SalesPilot Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });

    } catch (error) {
      console.error('Error sending email:', error.message);
      throw new Error('Failed to send email.');
    }
  }

  /**
   * Create a new user and send activation email
   * @param {Object} userData - User data
   * @param {String} tenantDomain - Tenant's domain
   */
  static async create(userData, tenantDomain = 'localhost') {
    try {
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided.');
      }

      const { username, email, phone, password, confirm_password, location, role = 'sales' } = userData;
      const hashedPassword = await bcryptUtils.hashPassword(password);

      let tenant_id;
      const tenantCheckQuery = `SELECT tenant_id FROM tenants WHERE tenant_domain = ?`;
      const tenantResult = await executeQuery(tenantCheckQuery, [tenantDomain]);

      if (tenantResult.length > 0) {
        tenant_id = tenantResult[0].tenant_id;
      } else {
        const insertTenantQuery = `INSERT INTO tenants (tenant_domain) VALUES (?)`;
        const insertTenantResult = await executeQuery(insertTenantQuery, [tenantDomain]);
        if (!insertTenantResult || !insertTenantResult.insertId) {
          throw new Error('Failed to create tenant.');
        }
        tenant_id = insertTenantResult.insertId;
      }

      // Generate activation token
      const activationToken = crypto.randomBytes(32).toString('hex');

      // Insert user with activation token
      const query = `
        INSERT INTO users (username, email, phone, password, confirm_password, location, role, tenant_id, activation_token, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `;
      const userResult = await executeQuery(query, [username, email, phone, hashedPassword, confirm_password, location, role, tenant_id, activationToken]);

      if (!userResult || !userResult.insertId) {
        throw new Error('Failed to create user.');
      }

      // Send activation email
      const activationLink = `https://${tenantDomain}/activate?token=${activationToken}`;
      const emailHtml = `
        <h3>Activate Your Account</h3>
        <p>Click the link below to activate your account:</p>
        <a href="${activationLink}">Activate Account</a>
      `;
      await this.sendEmail(email, 'Activate Your Account', emailHtml);

      return { id: userResult.insertId, username, email, phone, location, role, tenant_id };
    } catch (error) {
      console.error('Error in create method:', error.message);
      throw error;
    }
  }

  /**
   * Activate user account using token
   * @param {String} token - Activation token
   */
  static async activateAccount(token) {
    try {
      if (!token) {
        throw new Error('Activation token is required.');
      }

      const query = `SELECT id FROM users WHERE activation_token = ? AND is_active = 0`;
      const result = await executeQuery(query, [token]);

      if (result.length === 0) {
        throw new Error('Invalid or expired activation token.');
      }

      const userId = result[0].id;
      await executeQuery(`UPDATE users SET is_active = 1, activation_token = NULL WHERE id = ?`, [userId]);

      return { success: true, message: 'Account activated successfully.' };
    } catch (error) {
      console.error('Error activating account:', error.message);
      throw error;
    }
  }

  /**
   * Request a password reset and send email
   * @param {String} email - User email
   */
  static async requestPasswordReset(email) {
    try {
      if (!email) {
        throw new Error('Email is required.');
      }

      const userQuery = `SELECT id FROM users WHERE email = ?`;
      const userResult = await executeQuery(userQuery, [email]);

      if (userResult.length === 0) {
        throw new Error('No account found with this email.');
      }

      const userId = userResult[0].id;
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

      await executeQuery(
        `UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
        [resetToken, resetTokenExpiry, userId]
      );

      // Send password reset email
      const resetLink = `https://localhost/reset-password?token=${resetToken}`;
      const emailHtml = `
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
      `;
      await this.sendEmail(email, 'Reset Your Password', emailHtml);

      return { success: true, message: 'Password reset email sent successfully.' };
    } catch (error) {
      console.error('Error in requestPasswordReset:', error.message);
      throw error;
    }
  }

  /**
   * Reset password using token
   * @param {String} token - Reset token
   * @param {String} newPassword - New password
   */
  static async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        throw new Error('Token and new password are required.');
      }

      const query = `SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()`;
      const result = await executeQuery(query, [token]);

      if (result.length === 0) {
        throw new Error('Invalid or expired reset token.');
      }

      const userId = result[0].id;
      const hashedPassword = await bcryptUtils.hashPassword(newPassword);

      await executeQuery(`UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`, [hashedPassword, userId]);

      return { success: true, message: 'Password has been reset successfully.' };
    } catch (error) {
      console.error('Error in resetPassword:', error.message);
      throw error;
    }
  }
}

module.exports = UserModel;
