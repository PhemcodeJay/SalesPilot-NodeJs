const { User, Tenant } = require('../models');
const { 
  sendActivationEmail, 
  sendPasswordResetEmail 
} = require('../utils/emailUtils');
const authService = require('../services/AuthService');
const { 
  rateLimitActivationRequests,
  apiLimiter 
} = require('../middleware/rateLimiter');
const { logError, logSecurityEvent } = require('../utils/logger');
const PasswordResetService = require('../services/PasswordResetService');

// Secure Cookie Options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

/**
 * Sign Up Controller - Handles user registration across both main and tenant DBs
 */
const signUpController = async (req, res) => {
  try {
    const {
      username, email, password, phone, location,
      tenantName, tenantEmail, tenantPhone, tenantAddress,
      role = 'sales',
      plan = 'trial'
    } = req.body;

    // Rate limiting
    const isRateLimited = await rateLimitActivationRequests(email);
    if (isRateLimited) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Prepare data for both databases
    const userData = { username, email, password, phone, location, role };
    const tenantData = { 
      tenant: { 
        name: tenantName, 
        email: tenantEmail, 
        phone: tenantPhone, 
        address: tenantAddress 
      }
    };
    
    // Example tenant-specific data (customize based on your tenant schema)
    const tenantDbData = {
      product: { name: 'Default Product', price: 0, description: 'Sample product' },
      order: { status: 'pending', total: 0 }
    };

    // Call enhanced signUp service
    const result = await authService.signUp(
      userData, 
      tenantData, 
      tenantDbData,
      plan,
      { ipAddress: req.ip }
    );

    // Send activation email if enabled
    if (authService.emailEnabled && result.activationCode) {
      await sendActivationEmail(email, result.activationCode, username);
    }

    logSecurityEvent('user_signup_success', {
      email,
      tenantName,
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: authService.emailEnabled 
        ? 'Account created. Please check your email for activation.' 
        : 'Account created and activated successfully.',
      data: {
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role,
          status: result.user.status
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          status: result.tenant.status
        },
        subscription: result.subscription,
        ...(result.redirectPath && { redirect: result.redirectPath }),
      }
    });

  } catch (err) {
    logError('signUpController error', err, {
      email: req.body.email,
      ipAddress: req.ip
    });
    
    const errorMessage = err.message.includes('unique constraint') 
      ? 'Email or organization name already exists'
      : (err.message || 'Signup failed. Please check your input and try again.');
    
    return res.status(400).json({ error: errorMessage });
  }
};

/**
 * Login Controller - Handles user authentication
 */
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Apply rate limiting
    await apiLimiter(req, res, async () => {
      const result = await authService.login(email, password, { ipAddress: req.ip });
      
      // Set secure cookie
      res.cookie('token', result.token, cookieOptions);
      
      logSecurityEvent('user_login_success', {
        userId: result.user.id,
        email,
        ipAddress: req.ip
      });

      return res.status(200).json({
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
            tenant_id: result.user.tenant_id,
            Tenant: result.user.Tenant,
            subscription: result.user.subscription,
            pendingActivation: result.user.pendingActivation
          },
          token: result.token // Also return token in response for clients that don't use cookies
        }
      });
    });

  } catch (err) {
    logError('loginController error', err, {
      email: req.body.email,
      ipAddress: req.ip
    });
    
    const errorMessage = err.message.includes('credentials') 
      ? 'Invalid email or password'
      : err.message;
    
    return res.status(401).json({ error: errorMessage });
  }
};

/**
 * Logout Controller - Handles user logout
 */
const logoutController = (req, res) => {
  try {
    logSecurityEvent('user_logout', {
      userId: req.user?.id,
      ipAddress: req.ip
    });

    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    logError('logoutController error', err, {
      ipAddress: req.ip
    });
    return res.status(500).json({ error: 'Logout failed.' });
  }
};

/**
 * Activation Controller - Handles account activation
 */
const activateUserController = async (req, res) => {
  try {
    const { activationCode, email, action, userId } = req.body;

    if (action === 'activate') {
      if (!activationCode || !userId) {
        return res.status(400).json({ error: 'Missing activation code or user ID' });
      }

      const success = await authService.activateUser(activationCode, userId, { 
        ipAddress: req.ip 
      });
      
      if (!success) {
        return res.status(400).json({ error: 'Invalid or expired activation code.' });
      }

      logSecurityEvent('user_activation_success', {
        userId,
        ipAddress: req.ip
      });

      return res.status(200).json({ 
        message: 'Account activated successfully. You can now login.' 
      });

    } else if (action === 'resend') {
      const user = await User.findOne({ 
        where: { email, status: 'pending_activation' },
        attributes: ['id', 'email', 'username', 'tenant_id']
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Pending activation user not found.' });
      }

      // Generate new activation code
      const activationService = new ActivationCodeService(user.tenant_id);
      const code = await activationService.generate({ 
        userId: user.id,
        ipAddress: req.ip
      });

      await sendActivationEmail(user.email, code, user.username);

      logSecurityEvent('activation_code_resent', {
        userId: user.id,
        email: user.email,
        ipAddress: req.ip
      });

      return res.status(200).json({ message: 'Activation code resent.' });
    }

    return res.status(400).json({ error: 'Invalid action specified.' });

  } catch (err) {
    logError('activateUserController error', err, {
      action: req.body.action,
      ipAddress: req.ip
    });
    
    return res.status(500).json({ 
      error: err.message || 'Activation process failed.' 
    });
  }
};

/**
 * Refresh Token Controller - Handles JWT token refresh
 */
const refreshTokenController = async (req, res) => {
  try {
    const token = req.cookies.token || req.body.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const { newToken } = await authService.refreshToken(token);
    res.cookie('token', newToken, cookieOptions);
    
    logSecurityEvent('token_refreshed', {
      userId: req.user?.id,
      ipAddress: req.ip
    });

    return res.status(200).json({ 
      message: 'Token refreshed successfully.',
      token: newToken 
    });
  } catch (err) {
    logError('refreshTokenController error', err, {
      ipAddress: req.ip
    });
    return res.status(401).json({ 
      error: err.message || 'Token refresh failed. Please login again.' 
    });
  }
};

/**
 * Password Reset Request Controller - Initiates password reset
 */
const requestPasswordResetController = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Apply rate limiting
    await apiLimiter(req, res, async () => {
      const user = await User.findOne({ 
        where: { email },
        attributes: ['id', 'email', 'username', 'tenant_id']
      });
      
      // Don't reveal if user doesn't exist (security best practice)
      if (!user) {
        return res.status(200).json({
          message: 'If an account with this email exists, a reset link has been sent'
        });
      }

      // Initialize password reset service for the tenant
      const passwordResetService = new PasswordResetService(user.tenant_id);
      
      // Generate reset token
      const { code: resetToken } = await passwordResetService.generateResetToken(
        user.id,
        { ipAddress: req.ip }
      );
      
      // Generate reset link with token
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, resetLink, user.username);
      
      logSecurityEvent('password_reset_requested', {
        userId: user.id,
        email: user.email,
        ipAddress: req.ip
      });

      return res.status(200).json({
        message: 'Password reset link sent to your email',
        data: {
          email: user.email,
          // In production, you might want to omit these details
          resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        }
      });
    });

  } catch (err) {
    logError('requestPasswordResetController error', err, {
      email: req.body.email,
      ipAddress: req.ip
    });
    return res.status(500).json({ 
      error: err.message || 'Password reset request failed.' 
    });
  }
};

/**
 * Password Reset Controller - Completes password reset
 */
const resetPasswordController = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    // Validate input
    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Token, email and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user to get tenant information
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'tenant_id']
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email address' });
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
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    logSecurityEvent('password_reset_successful', {
      userId: user.id,
      email: user.email,
      ipAddress: req.ip
    });

    return res.status(200).json({ 
      message: 'Password reset successfully. You can now login with your new password.',
      data: {
        email: user.email
      }
    });

  } catch (err) {
    logError('resetPasswordController error', err, {
      email: req.body.email,
      ipAddress: req.ip
    });
    
    // Handle specific error cases
    if (err.message.includes('expired') || err.message.includes('invalid')) {
      return res.status(400).json({ error: err.message });
    }
    
    return res.status(500).json({ 
      error: err.message || 'Password reset failed.' 
    });
  }
};

module.exports = {
  signUpController,
  loginController,
  logoutController,
  activateUserController,
  refreshTokenController,
  requestPasswordResetController,
  resetPasswordController
};