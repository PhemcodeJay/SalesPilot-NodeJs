const { User } = require('../models');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const PasswordResetService = require('../services/PasswordResetService');
const { logError, logSecurityEvent } = require('../utils/logger');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * Request Password Reset Controller
 * Handles initial password reset request and email sending
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }

    // Apply rate limiting
    await apiLimiter(req, res, async () => {
      // Find user in main database with minimal attributes
      const user = await User.findOne({ 
        where: { email },
        attributes: ['id', 'email', 'username', 'tenant_id'],
        raw: true
      });
      
      // Security: Don't reveal if user doesn't exist
      if (!user) {
        logSecurityEvent('password_reset_request_attempt', {
          email,
          ip: req.ip,
          status: 'user_not_found'
        });
        
        return res.status(200).json({
          message: 'If an account with this email exists, a reset link has been sent',
          code: 'RESET_EMAIL_SENT'
        });
      }

      // Initialize password reset service for the tenant
      const passwordResetService = new PasswordResetService(user.tenant_id);
      
      // Generate reset token with IP tracking
      const { code: resetToken, resetRecord } = await passwordResetService.generateResetToken(
        user.id,
        { ipAddress: req.ip }
      );
      
      // Generate secure reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, resetLink, user.username);
      
      // Log security event with all relevant context
      logSecurityEvent('password_reset_requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        tenantId: user.tenant_id,
        resetId: resetRecord.id,
        tokenExpiresAt: resetRecord.expires_at
      });

      // Return success response
      res.status(200).json({
        message: 'Password reset link sent to your email',
        code: 'RESET_EMAIL_SENT',
        data: {
          email: user.email,
          // Only include token in development for testing
          ...(process.env.NODE_ENV === 'development' && { 
            debug: { resetToken } 
          })
        }
      });
    });

  } catch (error) {
    logError('requestPasswordReset error', error, {
      email: req.body.email,
      ip: req.ip
    });
    
    res.status(500).json({ 
      error: 'Failed to process password reset request',
      code: 'RESET_REQUEST_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset Password Controller
 * Handles actual password reset with token verification
 */
const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    // Validate input with specific error codes
    if (!token || !email || !newPassword) {
      return res.status(400).json({ 
        error: 'Token, email and new password are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Find user with minimal attributes
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'tenant_id'],
      raw: true
    });

    if (!user) {
      logSecurityEvent('password_reset_attempt', {
        email,
        ip: req.ip,
        status: 'user_not_found'
      });
      
      return res.status(400).json({ 
        error: 'Invalid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Initialize password reset service for the tenant
    const passwordResetService = new PasswordResetService(user.tenant_id);
    
    // Process password reset using the secure method that handles both DBs
    const resetSuccessful = await passwordResetService.securePasswordReset(
      token, 
      newPassword,
      req.ip
    );
    
    if (!resetSuccessful) {
      logSecurityEvent('password_reset_attempt', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        tenantId: user.tenant_id,
        status: 'invalid_token'
      });
      
      return res.status(400).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Log successful security event
    logSecurityEvent('password_reset_successful', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      tenantId: user.tenant_id
    });

    // Return success response
    res.status(200).json({ 
      message: 'Password reset successfully',
      code: 'PASSWORD_RESET_SUCCESS',
      data: {
        email: user.email
      }
    });

  } catch (error) {
    logError('resetPassword error', error, {
      email: req.body.email,
      ip: req.ip
    });
    
    // Handle specific error cases with appropriate codes
    if (error.message.includes('expired')) {
      return res.status(400).json({ 
        error: 'Password reset token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('invalid')) {
      return res.status(400).json({ 
        error: 'Invalid password reset token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to reset password',
      code: 'PASSWORD_RESET_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Validate Reset Token Controller
 * Checks if a password reset token is valid
 */
const validateResetToken = async (req, res) => {
  try {
    const { token, email } = req.query;
    
    if (!token || !email) {
      return res.status(400).json({ 
        error: 'Token and email are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Find user with minimal attributes
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'tenant_id'],
      raw: true
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid email address',
        code: 'INVALID_EMAIL'
      });
    }

    // Initialize password reset service for the tenant
    const passwordResetService = new PasswordResetService(user.tenant_id);
    
    // Verify the token with IP tracking
    const isValid = await passwordResetService.verifyResetToken(token, { 
      ipAddress: req.ip 
    });
    
    if (!isValid) {
      logSecurityEvent('password_reset_token_validation', {
        email,
        ip: req.ip,
        status: 'invalid_token',
        tenantId: user.tenant_id
      });
      
      return res.status(400).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Log successful validation
    logSecurityEvent('password_reset_token_validation', {
      userId: user.id,
      email,
      ip: req.ip,
      status: 'valid_token',
      tenantId: user.tenant_id
    });

    res.status(200).json({ 
      valid: true,
      message: 'Token is valid',
      code: 'VALID_RESET_TOKEN'
    });

  } catch (error) {
    logError('validateResetToken error', error, {
      email: req.query.email,
      ip: req.ip
    });
    
    res.status(500).json({ 
      error: 'Failed to validate token',
      code: 'TOKEN_VALIDATION_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  validateResetToken
};