const bcryptUtils = require('../utils/bcryptUtils');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/user');
const { ActivationCode } = require('../models/authModel');
const Subscription = require('../models/subscriptions'); // Import Subscription model

class AuthController {
  // User Registration with Free Trial Subscription
  signup = asyncHandler(async (req, res) => {
    const { username, email, password, confirm_password, phone, location, user_image } = req.body;

    // Validate required fields
    if (!username || !email || !password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'Username, email, password, and confirm password are required.' });
    }

    // Validate passwords match
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Validate password strength
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and include both letters and numbers.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcryptUtils.hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      location,
      user_image: user_image || 'default-image.jpg',
      role: 'sales',
      status: 'inactive', // Initially inactive until email is activated
    });

    // Create free trial subscription for the user
    const subscription = await Subscription.createFreeTrial(user.id);

    // Generate and save activation code
    const activationCode = crypto.randomBytes(20).toString('hex');
    await ActivationCode.create({
      user_id: user.id,
      activation_code: activationCode,
      expires_at: new Date(Date.now() + 3600000), // 1-hour expiry
    });

    // Send activation email
    await sendActivationEmail(email, activationCode);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to activate your account.',
      subscriptionId: subscription.id,
    });
  });

  // Activate Account
  activateAccount = asyncHandler(async (req, res) => {
    const { activation_code } = req.body;

    if (!activation_code) {
      return res.status(400).json({ success: false, message: 'Activation code is required.' });
    }

    const activationRecord = await ActivationCode.findOne({ where: { activation_code } });
    if (!activationRecord) {
      return res.status(400).json({ success: false, message: 'Invalid activation code.' });
    }

    if (new Date(activationRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Activation code has expired.' });
    }

    await User.update({ status: 'active' }, { where: { id: activationRecord.user_id } });
    await ActivationCode.destroy({ where: { activation_code } });

    res.status(200).json({ success: true, message: 'Account activated successfully.' });
  });

  // Login User
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials or account not activated.' });
    }

    if (user.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Account not activated.' });
    }

    const isPasswordValid = await bcryptUtils.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  });

  // Request Password Reset
  requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'No user found with that email address.' });
    }

    const resetToken = uuidv4();
    await ActivationCode.create({
      user_id: user.id,
      activation_code: resetToken,
      expires_at: new Date(Date.now() + 3600000), // 1-hour expiry
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(email, resetUrl);

    res.status(200).json({ success: true, message: 'Password reset email sent.' });
  });

  // Reset Password
  resetPassword = asyncHandler(async (req, res) => {
    const { reset_code, new_password } = req.body;

    if (!reset_code || !new_password) {
      return res.status(400).json({ success: false, message: 'Reset code and new password are required.' });
    }

    const resetRecord = await ActivationCode.findOne({ where: { activation_code: reset_code } });
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid reset code.' });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset code has expired.' });
    }

    const hashedPassword = await bcryptUtils.hashPassword(new_password);
    await User.update({ password: hashedPassword }, { where: { id: resetRecord.user_id } });
    await ActivationCode.destroy({ where: { activation_code: reset_code } });

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  });
}

module.exports = new AuthController();
