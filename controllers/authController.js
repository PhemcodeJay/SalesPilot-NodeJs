const bcrypt = require('bcryptjs');
const { User } = require('../models');
const PasswordResetService = require('../services/passwordresetService');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const { signUp, login } = require('../services/authService');
const { verifyActivationCode } = require('../services/activationCodeService');
const { rateLimitActivationRequests } = require('../middleware/rateLimiter');

// ✅ SignUp Controller
const signUpController = async (req, res) => {
  const {
    username,
    email,
    password,
    phone,
    location,
    tenantName,
    tenantEmail,
    tenantPhone,
    tenantAddress
  } = req.body;

  try {
    // Check rate limiting for activation requests
    const isRateLimited = await rateLimitActivationRequests(email);
    if (isRateLimited) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Prepare user and tenant data
    const userData = {
      username,
      email,
      password,
      phone,
      location,
      role: 'sales'  // Default role for user
    };

    const tenantData = {
      name: tenantName,
      email: tenantEmail,
      phone: tenantPhone,
      address: tenantAddress
    };

    // Sign up user and create tenant, subscription
    const { user, tenant, subscription } = await signUp(userData, tenantData);

    // ✅ Activation email already sent inside signUp — no need to call again here

    // Return successful response
    res.status(201).json({
      message: 'User and tenant registered successfully. Please check your email to activate your account.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        location: user.location,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        status: tenant.status,
      },
      subscription: {
        id: subscription.id,
        plan: subscription.plan, // 🔧 fixed reference
        status: subscription.status,
      },
    });
  } catch (err) {
    console.error('SignUp error:', err);
    res.status(500).json({ error: err.message || 'Error registering user. Please try again.' });
  }
};

// ✅ Login Controller
const loginController = async (req, res) => {
  const { email, password, tenant_id } = req.body;

  try {
    const { user, token } = await login({ email, password, tenant_id });
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
};

// ✅ Logout Controller
const logoutController = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// ✅ Password Reset Request
const passwordResetRequestController = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { code } = await PasswordResetService.generateResetToken(user.id);
    const resetLink = `${process.env.FRONTEND_URL}/recoverpwd?token=${code}`;
    await sendPasswordResetEmail(user.email, resetLink);

    return res.status(200).json({ message: 'We have sent a password reset link to your email.' });
  } catch (err) {
    console.error('Error sending password reset email:', err);
    return res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
};

// ✅ Password Reset Confirmation
const passwordResetConfirmController = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const reset = await PasswordResetService.verifyResetToken(token);
    if (!reset) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const user = await User.findOne({ where: { id: reset.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = hashedPassword;
    await user.save();
    await reset.destroy();

    return res.status(200).json({ message: 'Password successfully reset' });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Account Activation
const activateUser = async (req, res) => {
  try {
    const { userId, activationCode } = req.query;
    await verifyActivationCode(activationCode, userId);
    res.status(200).json({ message: 'Account activated successfully.' });
  } catch (error) {
    console.error('Activation error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  signUpController,
  loginController,
  logoutController,
  passwordResetRequestController,
  passwordResetConfirmController,
  activateUser,
};
