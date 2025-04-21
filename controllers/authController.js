const bcrypt = require('bcryptjs');
const { User } = require('../models');
const PasswordResetService = require('../services/passwordresetService');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const { signUp, login, activateUser } = require('../services/authService');
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
    tenantAddress,
  } = req.body;

  try {
    // Rate limiting for activation requests
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
      role: 'sales',  // Default role as sales
    };

    const tenantData = {
      name: tenantName,
      email: tenantEmail,
      phone: tenantPhone,
      address: tenantAddress,
    };

    // Perform signup and create the user, tenant, and subscription
    const { user, tenant, subscription, activationCode } = await signUp(userData, tenantData);

    res.status(201).json({
      message: 'User and tenant registered successfully. Please check your email to activate your account.',
      data: {
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
          plan: subscription.plan,
          status: subscription.status,
        },
      }
    });
  } catch (err) {
    console.error('SignUp error:', err);
    res.status(500).json({ error: err.message || 'Error registering user. Please try again.' });
  }
};

// ✅ Login Controller
const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Perform login and generate JWT token
    const { user, token } = await login(email, password);

    res.status(200).json({
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token
      }
    });
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

// ✅ Password Reset Request Controller
const passwordResetRequestController = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const { code } = await PasswordResetService.generateResetToken(user.id);
    const resetLink = `${process.env.FRONTEND_URL}/recoverpwd?token=${code}`;

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetLink);

    return res.status(200).json({ message: 'We have sent a password reset link to your email.' });
  } catch (err) {
    console.error('Error sending password reset email:', err);
    return res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
};

// ✅ Password Reset Confirmation Controller
const passwordResetConfirmController = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify reset token and reset password
    const reset = await PasswordResetService.verifyResetToken(token);
    if (!reset) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const user = await User.findOne({ where: { id: reset.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save new password
    user.password = hashedPassword;
    await user.save();
    await reset.destroy();

    return res.status(200).json({ message: 'Password successfully reset' });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Account Activation Controller
const activateUserController = async (req, res) => {
  try {
    const { activationCode } = req.query;

    // Ensure required query parameter
    if (!activationCode) {
      return res.status(400).json({ error: 'Missing activation code' });
    }

    // Activate the user
    await activateUser(activationCode);

    res.status(200).json({
      message: 'Account activated successfully.'
    });
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
  activateUserController,
};
