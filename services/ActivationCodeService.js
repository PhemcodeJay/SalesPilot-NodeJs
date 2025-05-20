const { getTenantDb, models } = require('../config/db');
const { logError, logSecurityEvent } = require('../utils/logger');
const { sendActivationEmail } = require('../utils/emailUtils');

class ActivationCodeService {
  constructor(tenantId) {
    if (!tenantId) throw new Error('Tenant ID is required');
    this.tenantId = tenantId;
    this.tenantDb = getTenantDb(`tenant_${tenantId}`);
  }

  /**
   * Generate and store activation code for tenant user
   * @param {object} transaction - Optional transaction
   * @returns {Promise<string>} Generated activation code
   */
  async generate(transaction = null) {
    const t = transaction || null;
    
    try {
      // Get user from main DB
      const user = await models.User.findOne({ 
        where: { tenant_id: this.tenantId },
        transaction: t
      });
      
      if (!user) {
        throw new Error(`User not found for tenant ${this.tenantId}`);
      }

      // Clean up expired codes first
      await this._cleanupExpiredCodes(t);

      // Check rate limiting
      if (await this._isRateLimited(user.id, t)) {
        throw new Error('Please wait before requesting another activation code');
      }

      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create activation code in main DB
      const activationCode = await models.ActivationCode.create({
        user_id: user.id,
        tenant_id: this.tenantId,
        code,
        expires_at: expiresAt,
        ip_address: null // Can be set from request context
      }, { transaction: t });

      // Create audit record in tenant DB
      await this.tenantDb.models.ActivationAudit.create({
        activation_id: activationCode.id,
        user_id: user.id,
        action: 'code_generated',
        created_at: new Date()
      }, { transaction: t });

      // Send activation email if enabled
      if (process.env.EMAIL_ENABLED !== 'false') {
        await sendActivationEmail(user.email, code, {
          userName: user.name,
          tenantId: this.tenantId
        });
      }

      logSecurityEvent('activation_code_generated', {
        userId: user.id,
        tenantId: this.tenantId,
        codeId: activationCode.id
      });

      return code;

    } catch (error) {
      logError(`Activation code generation failed for tenant ${this.tenantId}`, error);
      throw error;
    }
  }

  /**
   * Verify activation code validity
   * @param {string} code - Activation code to verify
   * @param {object} transaction - Optional transaction
   * @returns {Promise<{success: boolean, message: string}>} Verification result
   */
  async verify(code, transaction = null) {
    const t = transaction || null;
    
    try {
      // Get user from main DB
      const user = await models.User.findOne({ 
        where: { tenant_id: this.tenantId },
        transaction: t
      });
      
      if (!user) {
        return { 
          success: false, 
          message: 'User account not found' 
        };
      }

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
          reason: 'invalid_or_expired'
        });
        
        return { 
          success: false, 
          message: 'Invalid or expired activation code' 
        };
      }

      // Create audit record in tenant DB
      await this.tenantDb.models.ActivationAudit.create({
        activation_id: record.id,
        user_id: user.id,
        action: 'code_verified',
        created_at: new Date()
      }, { transaction: t });

      // Mark code as used
      await record.update({ 
        used_at: new Date() 
      }, { transaction: t });

      logSecurityEvent('activation_code_verified', {
        userId: user.id,
        tenantId: this.tenantId,
        codeId: record.id
      });

      return { 
        success: true, 
        message: 'Activation successful' 
      };

    } catch (error) {
      logError(`Activation code verification failed for tenant ${this.tenantId}`, error);
      throw error;
    }
  }

  /**
   * Resend activation code with rate limiting
   * @param {object} transaction - Optional transaction
   * @returns {Promise<string>} New activation code
   */
  async resend(transaction = null) {
    const t = transaction || null;
    
    try {
      // Get user from main DB
      const user = await models.User.findOne({ 
        where: { tenant_id: this.tenantId },
        transaction: t
      });
      
      if (!user) {
        throw new Error(`User not found for tenant ${this.tenantId}`);
      }

      // Check rate limiting
      if (await this._isRateLimited(user.id, t)) {
        throw new Error('Please wait before requesting another activation code');
      }

      // Generate new code
      const newCode = await this.generate(t);

      logSecurityEvent('activation_code_resent', {
        userId: user.id,
        tenantId: this.tenantId
      });

      return newCode;

    } catch (error) {
      logError(`Activation code resend failed for tenant ${this.tenantId}`, error);
      throw error;
    }
  }

  /**
   * Clean up expired activation codes (for cron jobs)
   * @param {object} transaction - Optional transaction
   * @returns {Promise<number>} Count of deleted codes
   */
  static async cleanupExpiredCodes(transaction = null) {
    const t = transaction || null;
    
    try {
      const now = new Date();

      // Delete expired codes from main DB
      const deletedCount = await models.ActivationCode.destroy({
        where: {
          expires_at: { [Op.lt]: now },
          used_at: null
        },
        transaction: t
      });

      logSecurityEvent('activation_codes_cleaned', {
        count: deletedCount
      });

      return deletedCount;

    } catch (error) {
      logError('Failed to cleanup expired activation codes', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Clean up expired codes for this tenant
   * @param {object} transaction - Optional transaction
   * @returns {Promise<void>}
   */
  async _cleanupExpiredCodes(transaction = null) {
    const t = transaction || null;
    const now = new Date();

    await models.ActivationCode.destroy({
      where: {
        tenant_id: this.tenantId,
        expires_at: { [Op.lt]: now },
        used_at: null
      },
      transaction: t
    });
  }

  /**
   * Check if user is rate limited for code generation
   * @param {number} userId - User ID
   * @param {object} transaction - Optional transaction
   * @returns {Promise<boolean>} True if rate limited
   */
  async _isRateLimited(userId, transaction = null) {
    const t = transaction || null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentCodes = await models.ActivationCode.count({
      where: {
        user_id: userId,
        created_at: { [Op.gt]: oneHourAgo }
      },
      transaction: t
    });

    return recentCodes >= 3; // Max 3 codes per hour
  }
}

module.exports = ActivationCodeService;