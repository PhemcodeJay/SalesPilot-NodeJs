const {
  signUp,
  login,
  logout,
  passwordResetRequest,
  passwordResetConfirm
} = require('../services/authService');

const { sendActivationEmail, verifyActivationCode } = require('../services/activationCodeService');
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
      role: 'sales'
    };

    const tenantData = {
      name: tenantName,
      email: tenantEmail,
      phone: tenantPhone,
      address: tenantAddress
    };

    // Sign up user and create tenant, subscription
    const { user, tenant } = await signUp(userData, tenantData);

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

// ✅ Password Reset Request Controller
const passwordResetRequestController = async (req, res) => {
  const { email } = req.body;

  try {
    await passwordResetRequest(email);
    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: err.message || 'Error processing password reset request' });
  }
};

// ✅ Password Reset Confirmation Controller
const passwordResetConfirmController = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    await passwordResetConfirm(token, newPassword);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset confirmation error:', err);
    res.status(500).json({ error: err.message || 'Error resetting password' });
  }
};

// ✅ Optional: registerUser (redundant if using signUpController)
const registerUser = async (req, res) => {
  try {
    const { userData, tenantData } = req.body;
    const { user, tenant } = await signUp(userData, tenantData);
    res.status(201).json({
      message: 'User registered successfully. Please check your email for activation instructions.',
      user,
      tenant,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Account Activation Controller
const activateUser = async (req, res) => {
  try {
    const { userId, activationCode } = req.query;
    await verifyActivationCode(activationCode, userId);
    res.status(200).json({ message: 'Account activated successfully.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  signUpController,
  loginController,
  logoutController,
  passwordResetRequestController,
  passwordResetConfirmController,
  registerUser,
  activateUser,
};
