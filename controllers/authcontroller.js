const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User'); // Adjust based on your user model location
const sendEmail = require('../utils/emailUtils'); // Utility for sending emails
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true }); // CSRF middleware

// **User Signup**
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create activation token
    const activationToken = crypto.randomBytes(20).toString('hex');

    // Save user
    user = new User({
      name,
      email,
      password: hashedPassword,
      activationToken,
    });
    await user.save();

    // Send activation email
    const activationUrl = `${process.env.CLIENT_URL}/activate/${activationToken}`;
    await sendEmail(email, 'Account Activation', `Click here to activate: ${activationUrl}`);

    res.status(201).json({ message: 'User registered, check email for activation link' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// **Activate Account**
const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    let user = await User.findOne({ activationToken: token });

    if (!user) return res.status(400).json({ message: 'Invalid activation token' });

    user.activationToken = null; // Clear token
    user.isActive = true;
    await user.save();

    res.status(200).json({ message: 'Account activated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// **User Login**
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if user is active
    if (!user.isActive) return res.status(400).json({ message: 'Account not activated' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// **Get CSRF Token**
const getCsrfToken = (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
};

// **Request Password Reset**
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail(email, 'Password Reset Request', `Click here to reset password: ${resetUrl}`);

    res.json({ message: 'Password reset link sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// **Reset Password**
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    let user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// **Update Profile**
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// **Delete Account**
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// **Get User Details**
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// **Logout User**
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

// **Export Controllers**
module.exports = {
  signup,
  login,
  activateAccount,
  getCsrfToken,
  csrfProtection,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  deleteAccount,
  getUserDetails,
  logout,
};
