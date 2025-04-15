const { signUp, login, logout, passwordResetRequest, passwordResetConfirm } = require('../services/authService');
const { sendActivationEmail } = require('../services/activationCodeService');
const { createSubscription } = require('../services/subscriptionService');
const { rateLimitActivationRequests } = require('../middleware/rateLimiter');

// SignUp Controller (using authService for sign up and sending activation email)
const signUpController = async (req, res) => {
  const { username, email, password, phone, location } = req.body;

  try {
    // Check if activation email has been sent recently (rate-limiting)
    const isRateLimited = await rateLimitActivationRequests(email);
    if (isRateLimited) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Call the service method to handle the signup
    const { user, token } = await signUp({ username, email, password, phone, location });

    // Send activation email after signup
    await sendActivationEmail(user);

    // Create the default subscription (e.g., trial plan)
    await createSubscription(user.tenant_id, 'trial');

    res.status(201).json({ message: 'User registered, please check your email for activation', token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
};

// Login Controller (using authService for login)
const loginController = async (req, res) => {
  const { email, password, tenant_id } = req.body;

  try {
    // Call the service method to handle the login
    const { user, token } = await login({ email, password, tenant_id });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout Controller (clear the token cookie)
const logoutController = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// Password Reset Request Controller (using authService for password reset request)
const passwordResetRequestController = async (req, res) => {
  const { email } = req.body;

  try {
    // Call the service method to handle password reset request
    await passwordResetRequest(email);
    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: 'Error processing password reset request' });
  }
};

// Password Reset Confirmation Controller (using authService for password reset confirmation)
const passwordResetConfirmController = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Call the service method to handle password reset confirmation
    await passwordResetConfirm(token, newPassword);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset confirmation error:', err);
    res.status(500).json({ error: 'Error resetting password' });
  }
};

// User Registration Controller (separate for handling user data and tenant data)
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

// Account Activation Controller (to activate user account)
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
