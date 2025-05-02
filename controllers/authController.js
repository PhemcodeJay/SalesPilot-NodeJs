const { User } = require('../models');
const { sendActivationEmail } = require('../utils/emailUtils');
const { signUp, login, activateUser, refreshToken } = require('../services/authService');
const { rateLimitActivationRequests } = require('../middleware/rateLimiter');
const { logError } = require('../utils/logger');

// Secure Cookie Options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

// Sign Up Controller
const signUpController = async (req, res) => {
  try {
    const {
      username, email, password, phone, location,
      tenantName, tenantEmail, tenantPhone, tenantAddress,
      role = 'sales'
    } = req.body;

    // Rate limiting to avoid too many requests for activation
    const isRateLimited = await rateLimitActivationRequests(email);
    if (isRateLimited) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // User and Tenant data
    const userData = { username, email, password, phone, location, role };
    const tenantData = { name: tenantName, email: tenantEmail, phone: tenantPhone, address: tenantAddress };

    // Calling signUp service to create user, tenant, and subscription
    const { user, tenant, subscription, activationCode } = await signUp(userData, tenantData);

    const emailEnabled = process.env.EMAIL_ENABLED !== 'false';
    const responseMsg = emailEnabled
      ? 'Account created. Please activate via email.'
      : 'Account created and activated successfully.';

    // Return success message
    return res.status(201).json({
      message: responseMsg,
      data: {
        user,
        tenant,
        subscription,
        ...(emailEnabled && { activationCode }) // Include activation code if email is enabled
      }
    });

  } catch (err) {
    logError('signUpController error', err);
    return res.status(500).json({ error: err.message || 'Signup failed.' });
  }
};

// Login Controller
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await login(email, password);

    // Set secure JWT token in cookies
    res.cookie('token', token, cookieOptions);
    return res.status(200).json({
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        }
      }
    });
  } catch (err) {
    logError('loginController error', err);
    return res.status(401).json({ error: err.message || 'Login failed.' });
  }
};

// Logout Controller
const logoutController = (req, res) => {
  try {
    // Clear the JWT token cookie
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    logError('logoutController error', err);
    return res.status(500).json({ error: 'Logout failed.' });
  }
};

// Activation & Resend Controller
const activateUserController = async (req, res) => {
  try {
    const { activationCode, email, action, userId } = req.body;

    if (action === 'activate') {
      // Activate the user account
      if (!activationCode || !userId) {
        return res.status(400).json({ error: 'Missing activation code or user ID' });
      }

      const success = await activateUser(activationCode, userId);
      return res.status(success ? 200 : 400).json({
        [success ? 'success' : 'error']: success ? 'Account activated.' : 'Invalid or expired activation code.'
      });

    } else if (action === 'resend') {
      // Resend activation code to the user
      const user = await User.findOne({ where: { email, status: 'inactive' } });
      if (!user) return res.status(404).json({ error: 'Inactive user not found.' });

      // Generate and send the activation code
      const code = await generateActivationCode(user.id);
      await sendActivationEmail(user.email, code);

      return res.status(200).json({ success: 'Activation code resent.' });
    }

    return res.status(400).json({ error: 'Invalid action.' });

  } catch (err) {
    logError('activateUserController error', err);
    return res.status(500).json({ error: 'Activation process failed.' });
  }
};

// Refresh JWT Token Controller
const refreshTokenController = async (req, res) => {
  try {
    const { oldToken } = req.body;
    const { newToken } = await refreshToken(oldToken);

    // Set new JWT token in cookies
    res.cookie('token', newToken, cookieOptions);
    return res.status(200).json({ message: 'Token refreshed successfully.' });
  } catch (err) {
    logError('refreshTokenController error', err);
    return res.status(500).json({ error: 'Token refresh failed.' });
  }
};

module.exports = {
  signUpController,
  loginController,
  logoutController,
  activateUserController,
  refreshTokenController,
};
