const { User, Tenant } = require('../models');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const { 
  signUp, 
  login, 
  activateUser, 
  refreshToken,
  resetPassword,
  requestPasswordReset
} = require('../services/authService');
const { rateLimitActivationRequests } = require('../middleware/rateLimiter');
const { logError } = require('../utils/logger');

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
      role = 'sales'
    } = req.body;

    // Rate limiting
    const isRateLimited = await rateLimitActivationRequests(email);
    if (isRateLimited) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Prepare data for both databases
    const userData = { username, email, password, phone, location, role };
    const tenantData = { name: tenantName, email: tenantEmail, phone: tenantPhone, address: tenantAddress };
    
    // Example tenant-specific data (customize based on your tenant schema)
    const tenantDbData = {
      product: { name: 'Default Product', price: 0, description: 'Sample product' },
      order: { status: 'pending', total: 0 }
    };

    // Call enhanced signUp service
    const result = await signUp(userData, tenantData, tenantDbData);

    // Send activation email if enabled
    if (process.env.EMAIL_ENABLED !== 'false' && result.activationCode) {
      await sendActivationEmail(email, result.activationCode);
    }

    return res.status(201).json({
      message: process.env.EMAIL_ENABLED !== 'false' 
        ? 'Account created. Please check your email for activation.' 
        : 'Account created and activated successfully.',
      data: {
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          email: result.tenant.email,
        },
        ...(result.redirectPath && { redirect: result.redirectPath }),
      }
    });

  } catch (err) {
    logError('signUpController error', err);
    return res.status(400).json({ 
      error: err.message || 'Signup failed. Please check your input and try again.' 
    });
  }
};

/**
 * Login Controller - Handles user authentication
 */
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await login(email, password);

    // Set secure cookie
    res.cookie('token', token, cookieOptions);
    
    return res.status(200).json({
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          tenant: user.Tenant
        },
        token // Also return token in response for clients that don't use cookies
      }
    });
  } catch (err) {
    logError('loginController error', err);
    return res.status(401).json({ 
      error: err.message || 'Invalid email or password.' 
    });
  }
};

/**
 * Logout Controller - Handles user logout
 */
const logoutController = (req, res) => {
  try {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    logError('logoutController error', err);
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

      const success = await activateUser(activationCode, userId);
      if (!success) {
        return res.status(400).json({ error: 'Invalid or expired activation code.' });
      }

      return res.status(200).json({ 
        success: 'Account activated successfully. You can now login.' 
      });

    } else if (action === 'resend') {
      const user = await User.findOne({ where: { email, status: 'inactive' } });
      if (!user) {
        return res.status(404).json({ error: 'Inactive user not found.' });
      }

      const code = await generateActivationCode(user.id);
      await sendActivationEmail(user.email, code);

      return res.status(200).json({ success: 'Activation code resent.' });
    }

    return res.status(400).json({ error: 'Invalid action specified.' });

  } catch (err) {
    logError('activateUserController error', err);
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

    const { newToken } = await refreshToken(token);
    res.cookie('token', newToken, cookieOptions);
    
    return res.status(200).json({ 
      message: 'Token refreshed successfully.',
      token: newToken 
    });
  } catch (err) {
    logError('refreshTokenController error', err);
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
    const { resetToken, user } = await requestPasswordReset(email);

    await sendPasswordResetEmail(user.email, resetToken);

    return res.status(200).json({ 
      success: 'Password reset link sent to your email.',
      // In production, you might not want to send back the token
      // resetToken: resetToken // Only for development/testing
    });
  } catch (err) {
    logError('requestPasswordResetController error', err);
    return res.status(400).json({ 
      error: err.message || 'Password reset request failed.' 
    });
  }
};

/**
 * Password Reset Controller - Completes password reset
 */
const resetPasswordController = async (req, res) => {
  try {
    const { email, newPassword, resetToken } = req.body;
    await resetPassword(email, newPassword, resetToken);

    return res.status(200).json({ 
      success: 'Password reset successfully. You can now login with your new password.' 
    });
  } catch (err) {
    logError('resetPasswordController error', err);
    return res.status(400).json({ 
      error: err.message || 'Password reset failed. The link may have expired.' 
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