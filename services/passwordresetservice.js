const { getTenantDb, models } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { logError, logSecurityEvent } = require('../utils/logger');

class PasswordResetService {
  constructor(tenantId) {
    if (!tenantId) throw new Error('Tenant ID is required');
    this.tenantId = tenantId;
    this.tenantDb = getTenantDb(`tenant_${tenantId}`);
  }

  /**
   * Generate a password reset token
   * @param {number} userId - User ID
   * @param {object} transaction - Optional transaction
   * @returns {Promise<{code: string, resetRecord: object}>} Reset token and record
   */
  async generateResetToken(userId, transaction = null) {
    const t = transaction || null;
    
    try {
      const code = uuidv4();
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 1); // 1 hour expiration

      // Create reset record in main DB
      const resetRecord = await models.PasswordReset.create({
        user_id: userId,
        tenant_id: this.tenantId,
        reset_code: code,
        expires_at: expirationTime,
        created_at: new Date()
      }, { transaction: t });

      // Create audit record in tenant DB
      await this.tenantDb.models.PasswordResetAudit.create({
        reset_id: resetRecord.id,
        user_id: userId,
        action: 'token_generated',
        ip_address: null, // Can be added from request context
        created_at: new Date()
      }, { transaction: t });

      logSecurityEvent('password_reset_token_generated', {
        userId,
        tenantId: this.tenantId,
        resetId: resetRecord.id
      });

      return { code, resetRecord };

    } catch (error) {
      logError(`Password reset token generation failed for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Verify a password reset token
   * @param {string} code - Reset token
   * @param {object} transaction - Optional transaction
   * @returns {Promise<object|null>} Reset record if valid, null otherwise
   */
  async verifyResetToken(code, transaction = null) {
    const t = transaction || null;
    
    try {
      const now = new Date();

      const resetRecord = await models.PasswordReset.findOne({
        where: {
          reset_code: code,
          tenant_id: this.tenantId,
          expires_at: { [Op.gt]: now },
          used_at: null
        },
        transaction: t
      });

      if (!resetRecord) {
        logSecurityEvent('password_reset_token_verification_failed', {
          code,
          tenantId: this.tenantId,
          reason: 'invalid_or_expired'
        });
        return null;
      }

      return resetRecord;

    } catch (error) {
      logError(`Password reset token verification failed for code ${code}`, error);
      throw error;
    }
  }

  /**
   * Reset user password using valid token
   * @param {string} resetCode - Reset token
   * @param {string} newPassword - New password
   * @param {object} transaction - Optional transaction
   * @returns {Promise<boolean>} True if successful
   */
  async resetPassword(resetCode, newPassword, transaction = null) {
    const t = transaction || null;
    
    try {
      const resetRecord = await this.verifyResetToken(resetCode, t);
      if (!resetRecord) {
        throw new Error('Invalid or expired reset token');
      }

      // Get user from main DB
      const user = await models.User.findOne({
        where: {
          id: resetRecord.user_id,
          tenant_id: this.tenantId
        },
        transaction: t
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update password in main DB
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await user.update({ password: hashedPassword }, { transaction: t });

      // Update password in tenant DB (if needed)
      await this.tenantDb.models.User.update(
        { password_hash: hashedPassword },
        { where: { id: user.id }, transaction: t }
      );

      // Mark reset token as used
      await resetRecord.update({
        used_at: new Date()
      }, { transaction: t });

      // Create audit records
      await models.PasswordResetAudit.create({
        reset_id: resetRecord.id,
        user_id: user.id,
        action: 'password_reset',
        ip_address: null,
        created_at: new Date()
      }, { transaction: t });

      await this.tenantDb.models.PasswordResetAudit.create({
        reset_id: resetRecord.id,
        user_id: user.id,
        action: 'password_reset',
        ip_address: null,
        created_at: new Date()
      }, { transaction: t });

      logSecurityEvent('password_reset_successful', {
        userId: user.id,
        tenantId: this.tenantId,
        resetId: resetRecord.id
      });

      return true;

    } catch (error) {
      logError(`Password reset failed for code ${resetCode}`, error);
      throw error;
    }
  }

  /**
   * Clean up expired reset tokens (for cron jobs)
   * @param {object} transaction - Optional transaction
   * @returns {Promise<number>} Count of deleted tokens
   */
  static async cleanupExpiredTokens(transaction = null) {
    const t = transaction || null;
    
    try {
      const now = new Date();

      // Delete from main DB
      const deletedCount = await models.PasswordReset.destroy({
        where: {
          expires_at: { [Op.lt]: now },
          used_at: null
        },
        transaction: t
      });

      // Note: Tenant DB audit records should be kept for compliance

      logSecurityEvent('password_reset_tokens_cleaned', {
        count: deletedCount
      });

      return deletedCount;

    } catch (error) {
      logError('Failed to cleanup expired password reset tokens', error);
      throw error;
    }
  }
}

module.exports = PasswordResetService;