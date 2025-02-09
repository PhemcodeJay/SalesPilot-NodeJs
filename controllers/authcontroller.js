const bcryptUtils = require('../utils/bcryptUtils');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const asyncHandler = require('../middleware/asyncHandler');
const db = require('../models'); 
const { User, ActivationCode, Subscription, Tenant, PasswordResetToken } = db;

class AuthController {
  // **User Signup with Free Trial**
  signup = asyncHandler(async (req, res) => {
    const { username, email, password, confirm_password, phone, location, user_image } = req.body;

    if (!username || !email || !password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and include letters and numbers.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already in use. Please use a different email or log in.' });
    }

    // **Create Tenant**
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 90);

    const tenant = await Tenant.create({
      name: `${username}'s Business`,
      email: normalizedEmail,
      subscription_end_date: subscriptionEndDate
    });

    // **Create User**
    const hashedPassword = await bcryptUtils.hashPassword(password);
    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      location,
      user_image: user_image || 'default-image.jpg',
      role: 'sales',
      status: 'inactive',
      tenant_id: tenant.id
    });

    // **Create Free Trial Subscription**
    const subscription = await Subscription.create({
      user_id: user.id,
      tenant_id: tenant.id,
      type: 'trial',
      start_date: new Date(),
      end_date: subscriptionEndDate,
      status: 'active'
    });

    // **Generate & Store Activation Code**
    const activationCode = crypto.randomBytes(20).toString('hex');
    await ActivationCode.create({
      user_id: user.id,
      activation_code: activationCode,
      expires_at: new Date(Date.now() + 3600000) // 1 hour expiration
    });

    // **Send Activation Email**
    await sendActivationEmail(normalizedEmail, activationCode);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to activate your account.',
      subscriptionId: subscription.id
    });
  });

  // **Activate Account**
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

  // **Login User**
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    if (!user || !(await bcryptUtils.comparePassword(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Please activate your account first.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({ success: true, token, user });
  });

  // **Request Password Reset**
  requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.create({
      user_id: user.id,
      token: resetToken,
      expires_at: new Date(Date.now() + 3600000) // 1 hour expiration
    });

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  });

  // **Reset Password**
  resetPassword = asyncHandler(async (req, res) => {
    const { token, new_password, confirm_new_password } = req.body;

    if (!token || !new_password || !confirm_new_password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (new_password !== confirm_new_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const resetRecord = await PasswordResetToken.findOne({ where: { token } });
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    const hashedPassword = await bcryptUtils.hashPassword(new_password);
    await User.update({ password: hashedPassword }, { where: { id: resetRecord.user_id } });
    await PasswordResetToken.destroy({ where: { token } });

    res.status(200).json({ success: true, message: 'Password reset successful.' });
  });
}

module.exports = new AuthController();
