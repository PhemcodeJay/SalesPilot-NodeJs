const bcryptUtils = require('../utils/bcryptUtils');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const asyncHandler = require('../middleware/asyncHandler');
const { User, ActivationCode, Subscription, Tenant } = require('../models');

class AuthController {
  // User Registration with Free Trial Subscription
  signup = asyncHandler(async (req, res) => {
    const { username, email, password, confirm_password, phone, location, user_image } = req.body;

    // Validate required fields
    if (!username || !email || !password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Validate passwords match
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Validate password strength
    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain both letters and numbers.',
      });
    }

    // Check if user already exists (case insensitive)
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcryptUtils.hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      location,
      user_image: user_image || 'default-image.jpg',
      role: 'sales',
      status: 'inactive',
    });

    // Create Tenant for the User
    const tenant = await Tenant.create({
      name: `${user.username}'s Tenant`,
      status: 'active',
      email: user.email,
    });

    // Create Free Trial Subscription
    const subscription = await Subscription.create({
      user_id: user.id,
      tenant_id: tenant.id,
      type: 'free_trial',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    // Generate Activation Code
    const activationCode = crypto.randomBytes(20).toString('hex');
    await ActivationCode.create({
      user_id: user.id,
      activation_code: activationCode,
      expires_at: new Date(Date.now() + 3600000), // 1-hour expiry
    });

    // Send Activation Email
    await sendActivationEmail(email, activationCode);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email to activate your account.',
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
    if (!activationRecord || new Date(activationRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired activation code.' });
    }

    await User.update({ status: 'active' }, { where: { id: activationRecord.user_id } });
    await ActivationCode.destroy({ where: { activation_code } });

    res.status(200).json({ success: true, message: 'Account activated successfully.' });
  });

  // User Login
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user || !(await bcryptUtils.comparePassword(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not activated. Please check your email.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    });
  });

  // Request Password Reset
  requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
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
    if (!resetRecord || new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    const hashedPassword = await bcryptUtils.hashPassword(new_password);
    await User.update({ password: hashedPassword }, { where: { id: resetRecord.user_id } });
    await ActivationCode.destroy({ where: { activation_code: reset_code } });

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  });
}

module.exports = new AuthController();

