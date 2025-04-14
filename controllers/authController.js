const { signUp, login, logout, passwordResetRequest, passwordResetConfirm } = require('../services/authService');

// SignUp Controller (now using authService)
const signUpController = async (req, res) => {
  const { username, email, password, phone, location } = req.body;

  try {
    // Call the service method to handle the signup
    const { user, token } = await signUp({ username, email, password, phone, location });

    res.status(201).json({ message: 'User registered', token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
};

// Login Controller (now using authService)
const loginController = async (req, res) => {
  const { email, password, tenant_id } = req.body;

  try {
    // Call the service method to handle the login
    const { user, token } = await login({ email, password, tenant_id });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout Controller
const logoutController = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// Password Reset Request Controller (now using authService)
const passwordResetRequestController = async (req, res) => {
  const { email } = req.body;

  try {
    // Call the service method to handle password reset request
    await passwordResetRequest(email);
    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing password reset request' });
  }
};

// Password Reset Confirmation Controller (now using authService)
const passwordResetConfirmController = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Call the service method to handle password reset confirmation
    await passwordResetConfirm(token, newPassword);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error resetting password' });
  }
};

module.exports = {
  signUpController,
  loginController,
  logoutController,
  passwordResetRequestController,
  passwordResetConfirmController,
};
