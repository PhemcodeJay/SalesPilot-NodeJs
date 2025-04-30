const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const PasswordResetService = require('../services/passwordresetService');
const { signUp, login, activateUser, refreshToken } = require('../services/authService');
const { rateLimitActivationRequests } = require('../middleware/rateLimiter');
const { generateActivationCode } = require('../services/ActivationCodeService');
const { logError } = require('../utils/logger');

// Secure cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

// ✅ SignUp
const signUpController = async (req, res) => {
  const {
    username, email, password, phone, location,
    tenantName, tenantEmail, tenantPhone, tenantAddress,
    role = 'sales',
  } = req.body;

  try {
    const isRateLimited = await rateLimitActivationRequests(email);
    if (isRateLimited) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const userData = { username, email, password, phone, location, role };
    const tenantData = { name: tenantName, email: tenantEmail, phone: tenantPhone, address: tenantAddress };

    const { user, tenant, subscription, activationCode } = await signUp(userData, tenantData);

    const responseMsg = process.env.EMAIL_ENABLED === 'false'
      ? 'Account created and activated successfully.'
      : 'Account created. Please activate via email.';

    res.status(201).json({
      message: responseMsg,
      data: {
        user,
        tenant,
        subscription,
        activationCode: process.env.EMAIL_ENABLED === 'false' ? undefined : activationCode
      }
    });
  } catch (err) {
    logError('signUpController error', err);
    res.status(500).json({ error: err.message || 'Signup failed.' });
  }
};

// ✅ Login
const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { user, token } = await login(email, password);
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
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
    res.status(401).json({ error: err.message || 'Login failed.' });
  }
};

// ✅ Logout
const logoutController = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// ✅ Request Password Reset
const passwordResetRequestController = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { code } = await PasswordResetService.generateResetToken(user.id);
    const link = `${process.env.FRONTEND_URL}/recoverpwd?token=${code}`;
    await sendPasswordResetEmail(user.email, link);

    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (err) {
    logError('passwordResetRequestController error', err);
    res.status(500).json({ error: 'Reset request failed.' });
  }
};

// ✅ Confirm Password Reset
const passwordResetConfirmController = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const reset = await PasswordResetService.verifyResetToken(token);
    if (!reset) return res.status(400).json({ error: 'Invalid or expired token' });

    const user = await User.findByPk(reset.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    await reset.destroy();

    res.status(200).json({ message: 'Password successfully reset' });
  } catch (err) {
    logError('passwordResetConfirmController error', err);
    res.status(500).json({ error: 'Reset failed.' });
  }
};

// ✅ Activate or Resend
const activateUserController = async (req, res) => {
  const { activationCode, email, action, userId } = req.body;

  try {
    if (action === 'activate') {
      if (!activationCode || !userId) {
        return res.status(400).json({ error: 'Missing activation code or user ID' });
      }

      const success = await activateUser(activationCode, userId);
      return res.status(success ? 200 : 400).json({
        [success ? 'success' : 'error']: success ? 'Account activated.' : 'Invalid activation code.'
      });

    } else if (action === 'resend') {
      const user = await User.findOne({ where: { email, status: 'inactive' } });
      if (!user) return res.status(404).json({ error: 'Inactive user not found.' });

      const code = await generateActivationCode(user.id);
      await sendActivationEmail(user.email, code);

      res.status(200).json({ success: 'Activation code resent.' });
    } else {
      res.status(400).json({ error: 'Invalid action.' });
    }
  } catch (err) {
    logError('activateUserController error', err);
    res.status(500).json({ error: 'Activation failed.' });
  }
};

// ✅ Refresh JWT Token
const refreshTokenController = async (req, res) => {
  const { oldToken } = req.body;
  try {
    const { newToken } = await refreshToken(oldToken);
    res.cookie('token', newToken, cookieOptions);
    res.status(200).json({ message: 'Token refreshed.' });
  } catch (err) {
    logError('refreshTokenController error', err);
    res.status(500).json({ error: 'Token refresh failed.' });
  }
};

module.exports = {
  signUpController,
  loginController,
  logoutController,
  passwordResetRequestController,
  passwordResetConfirmController,
  activateUserController,
  refreshTokenController,
};
