const { User } = require('../models');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const { 
  requestPasswordReset: requestResetService,
  resetPassword: resetPasswordService 
} = require('../services/authService');
const { logError, logSecurityEvent } = require('../utils/logger');
const { rateLimiter } = require('../middleware/rateLimiter');

// Password reset rate limiter configuration
const resetRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 reset requests per windowMs
  message: 'Too many password reset requests from this IP, please try again later'
});

/**
 * Request Password Reset Controller
 * Handles initial password reset request and email sending
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Apply rate limiting
    await resetRateLimiter(req, res, async () => {
      const { resetToken, user } = await requestResetService(email);
      
      // Don't reveal if user doesn't exist (security best practice)
      if (!user) {
        return res.status(200).json({
          message: 'If an account with this email exists, a reset link has been sent'
        });
      }

      // Generate reset link with token
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, resetLink, user.username);
      
      // Log security event
      logSecurityEvent('password_reset_requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      res.status(200).json({
        message: 'Password reset link sent to your email',
        data: {
          email: user.email,
          // In production, you might want to omit these details
          resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        }
      });
    });

  } catch (error) {
    logError('requestPasswordReset error', error);
    res.status(500).json({ 
      error: 'Failed to process password reset request',
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
    
    // Validate input
    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Token, email and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Process password reset
    const resetResult = await resetPasswordService(token, email, newPassword);
    
    if (!resetResult.success) {
      return res.status(400).json({ error: resetResult.message });
    }

    // Log security event
    logSecurityEvent('password_reset_successful', {
      userId: resetResult.user.id,
      email: resetResult.user.email,
      ip: req.ip
    });

    res.status(200).json({ 
      message: 'Password reset successfully',
      data: {
        email: resetResult.user.email
      }
    });

  } catch (error) {
    logError('resetPassword error', error);
    
    // Handle specific error cases
    if (error.message.includes('expired') || error.message.includes('invalid')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to reset password',
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
      return res.status(400).json({ error: 'Token and email are required' });
    }

    // This would be implemented in your authService
    const isValid = await authService.validatePasswordResetToken(token, email);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.status(200).json({ 
      valid: true,
      message: 'Token is valid'
    });

  } catch (error) {
    logError('validateResetToken error', error);
    res.status(500).json({ 
      error: 'Failed to validate token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  validateResetToken
};