const { Op } = require('sequelize');
const { getTenantDb, models } = require('../config/db');
const { logError, logSecurityEvent } = require('../utils/logger');
const { sendActivationEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

class ActivationCodeService {
  constructor(tenantId) {
    if (!tenantId) throw new Error('Tenant ID is required');
    this.tenantId = tenantId;
    this.tenantDb = getTenantDb(`tenant_${tenantId}`);
    this.codeExpiryHours = parseInt(process.env.ACTIVATION_CODE_EXPIRY_HOURS) || 24;
    this.rateLimitCount = parseInt(process.env.ACTIVATION_RATE_LIMIT) || 3;
    this.rateLimitWindow = parseInt(process.env.ACTIVATION_RATE_LIMIT_WINDOW) || 60;
  }

  /**
   * Generate and store activation code for tenant user
   * @param {object} options - Configuration options
   * @param {object} [options.transaction] - Optional transaction
   * @param {string} [options.ipAddress] - IP address for security logging
   * @returns {Promise<string>} Generated activation code
   */
  async generate({ transaction = null, ipAddress = null } = {}) {
    const t = transaction || null;
    
    try {
      // Get user from main DB with proper error handling
      const user = await this._getUserWithValidation(t);

      // Clean up expired codes first
      await this._cleanupExpiredCodes(t);

      // Check rate limiting with configurable thresholds
      if (await this._isRateLimited(user.id, t)) {
        logSecurityEvent('activation_rate_limited', {
          userId: user.id,
          tenantId: this.tenantId,
          ipAddress
        });
        throw new Error('Please wait before requesting another activation code');
      }

      // Generate secure random code
      const code = this._generateSecureCode();
      const expiresAt = new Date(Date.now() + this.codeExpiryHours * 60 * 60 * 1000);

      // Create activation code in main DB
      const activationCode = await models.ActivationCode.create({
        user_id: user.id,
        tenant_id: this.tenantId,
        code,
        expires_at: expiresAt,
        ip_address: ipAddress
      }, { transaction: t });

      // Create audit record in tenant DB
      await this._createAuditRecord(activationCode.id, user.id, 'code_generated', t);

      // Send activation email if enabled
      if (this._shouldSendEmail()) {
        await this._sendActivationEmail(user, code);
      }

      logSecurityEvent('activation_code_generated', {
        userId: user.id,
        tenantId: this.tenantId,
        codeId: activationCode.id,
        ipAddress
      });

      return code;

    } catch (error) {
      logError(`Activation code generation failed for tenant ${this.tenantId}`, error, {
        tenantId: this.tenantId,
        operation: 'generate'
      });
      throw error;
    }
  }

  /**
   * Verify activation code validity
   * @param {string} code - Activation code to verify
   * @param {object} options - Configuration options
   * @param {object} [options.transaction] - Optional transaction
   * @param {string} [options.ipAddress] - IP address for security logging
   * @returns {Promise<{success: boolean, message: string, user?: object}>} Verification result
   */
  async verify(code, { transaction = null, ipAddress = null } = {}) {
    const t = transaction || null;
    
    try {
      // Get user from main DB with proper error handling
      const user = await this._getUserWithValidation(t);

      // Find valid, unexpired code
      const record = await models.ActivationCode.findOne({
        where: {
          user_id: user.id,
          tenant_id: this.tenantId,
          code,
          expires_at: { [Op.gt]: new Date() },
          used_at: null
        },
        transaction: t
      });

      if (!record) {
        logSecurityEvent('activation_code_verification_failed', {
          userId: user.id,
          tenantId: this.tenantId,
          reason: 'invalid_or_expired',
          ipAddress
        });
        
        return { 
          success: false, 
          message: 'Invalid or expired activation code' 
        };
      }

      // Create audit record in tenant DB
      await this._createAuditRecord(record.id, user.id, 'code_verified', t);

      // Mark code as used
      await record.update({ 
        used_at: new Date(),
        verification_ip: ipAddress
      }, { transaction: t });

      logSecurityEvent('activation_code_verified', {
        userId: user.id,
        tenantId: this.tenantId,
        codeId: record.id,
        ipAddress
      });

      return { 
        success: true, 
        message: 'Activation successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };

    } catch (error) {
      logError(`Activation code verification failed for tenant ${this.tenantId}`, error, {
        tenantId: this.tenantId,
        operation: 'verify',
        code: code.substring(0, 2) + '...' // Partial logging for security
      });
      throw error;
    }
  }

  /**
   * Resend activation code with rate limiting
   * @param {object} options - Configuration options
   * @param {object} [options.transaction] - Optional transaction
   * @param {string} [options.ipAddress] - IP address for security logging
   * @returns {Promise<string>} New activation code
   */
  async resend({ transaction = null, ipAddress = null } = {}) {
    const t = transaction || null;
    
    try {
      // Get user from main DB with proper error handling
      const user = await this._getUserWithValidation(t);

      // Check rate limiting with configurable thresholds
      if (await this._isRateLimited(user.id, t)) {
        logSecurityEvent('activation_resend_rate_limited', {
          userId: user.id,
          tenantId: this.tenantId,
          ipAddress
        });
        throw new Error('Please wait before requesting another activation code');
      }

      // Generate new code with the same options
      const newCode = await this.generate({ transaction: t, ipAddress });

      logSecurityEvent('activation_code_resent', {
        userId: user.id,
        tenantId: this.tenantId,
        ipAddress
      });

      return newCode;

    } catch (error) {
      logError(`Activation code resend failed for tenant ${this.tenantId}`, error, {
        tenantId: this.tenantId,
        operation: 'resend'
      });
      throw error;
    }
  }

  /**
   * Clean up expired activation codes (for cron jobs)
   * @param {object} options - Configuration options
   * @param {object} [options.transaction] - Optional transaction
   * @param {number} [options.batchSize] - Maximum number of codes to delete at once
   * @returns {Promise<{deletedCount: number, affectedTenants: string[]}>} Cleanup results
   */
  static async cleanupExpiredCodes({ transaction = null, batchSize = 1000 } = {}) {
    const t = transaction || null;
    
    try {
      const now = new Date();
      let deletedCount = 0;
      const affectedTenants = new Set();

      // Process in batches to avoid locking issues
      while (true) {
        const expiredCodes = await models.ActivationCode.findAll({
          where: {
            expires_at: { [Op.lt]: now },
            used_at: null
          },
          limit: batchSize,
          attributes: ['id', 'tenant_id'],
          transaction: t
        });

        if (expiredCodes.length === 0) break;

        const codeIds = expiredCodes.map(code => code.id);
        expiredCodes.forEach(code => affectedTenants.add(code.tenant_id));

        const count = await models.ActivationCode.destroy({
          where: { id: codeIds },
          transaction: t
        });

        deletedCount += count;
        
        // Small delay between batches to reduce DB load
        if (expiredCodes.length === batchSize) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logSecurityEvent('activation_codes_cleaned', {
        count: deletedCount,
        affectedTenants: Array.from(affectedTenants)
      });

      return {
        deletedCount,
        affectedTenants: Array.from(affectedTenants)
      };

    } catch (error) {
      logError('Failed to cleanup expired activation codes', error, {
        operation: 'cleanupExpiredCodes'
      });
      throw error;
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Get user with validation checks
   * @private
   */
  async _getUserWithValidation(transaction) {
    const user = await models.User.findOne({ 
      where: { tenant_id: this.tenantId },
      transaction,
      attributes: ['id', 'email', 'name', 'is_active']
    });
    
    if (!user) {
      throw new Error(`User not found for tenant ${this.tenantId}`);
    }

    if (user.is_active) {
      throw new Error('User account is already active');
    }

    return user;
  }

  /**
   * Generate secure random activation code
   * @private
   */
  _generateSecureCode() {
    // Use crypto module for secure random generation
    const buffer = crypto.randomBytes(6);
    // Convert to alphanumeric (0-9, A-Z)
    return buffer.toString('base64')
      .replace(/[+/]/g, '0') // Replace special characters with 0
      .substring(0, 8)
      .toUpperCase();
  }

  /**
   * Create audit record in tenant DB
   * @private
   */
  async _createAuditRecord(activationId, userId, action, transaction) {
    return this.tenantDb.models.ActivationAudit.create({
      activation_id: activationId,
      user_id: userId,
      action,
      created_at: new Date()
    }, { transaction });
  }

  /**
   * Check if email should be sent
   * @private
   */
  _shouldSendEmail() {
    return process.env.EMAIL_ENABLED === 'true' && 
           process.env.NODE_ENV !== 'test';
  }

  /**
   * Send activation email with error handling
   * @private
   */
  async _sendActivationEmail(user, code) {
    try {
      await sendActivationEmail(user.email, code, {
        userName: user.name,
        tenantId: this.tenantId,
        expiryHours: this.codeExpiryHours
      });
    } catch (emailError) {
      logError('Failed to send activation email', emailError, {
        userId: user.id,
        tenantId: this.tenantId
      });
      // Don't throw - activation code is still valid
    }
  }

  /**
   * Clean up expired codes for this tenant
   * @private
   */
  async _cleanupExpiredCodes(transaction) {
    const now = new Date();

    await models.ActivationCode.destroy({
      where: {
        tenant_id: this.tenantId,
        expires_at: { [Op.lt]: now },
        used_at: null
      },
      transaction
    });
  }

  /**
   * Check if user is rate limited for code generation
   * @private
   */
  async _isRateLimited(userId, transaction) {
    const timeWindow = new Date(Date.now() - this.rateLimitWindow * 60 * 1000);

    const recentCodes = await models.ActivationCode.count({
      where: {
        user_id: userId,
        created_at: { [Op.gt]: timeWindow }
      },
      transaction
    });

    return recentCodes >= this.rateLimitCount;
  }
}

module.exports = ActivationCodeService;