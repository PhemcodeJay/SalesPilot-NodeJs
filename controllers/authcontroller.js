const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Auth = require('../models/authModel');
const Subscription = require('../models/subscriptions');
const sendEmail = require('../utils/emailUtils');

/** ======= TOKEN GENERATION FUNCTION ======= **/
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d', // Default: 7 days
  });
};

/** ======= MIDDLEWARE FOR AUTHORIZATION ======= **/
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

/** ======= SIGNUP WITH ACCOUNT ACTIVATION ======= **/
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate activation token and tenant ID
    const activationToken = crypto.randomBytes(20).toString('hex');
    const tenantId = uuidv4();

    // Set default subscription
    let defaultSubscription = await Subscription.findOne({ subscription_plan: 'trial' });
    if (!defaultSubscription) {
      defaultSubscription = new Subscription({
        subscription_plan: 'trial',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      });
      await defaultSubscription.save();
    }

    // Create new user
    const user = new User({ name, email, password: hashedPassword, subscriptionId: defaultSubscription._id, tenantId });
    await user.save();

    // Create user subscription
    await Subscription.createFreeTrial(user._id, tenantId);

    // Create user authentication record
    const auth = new Auth({ userId: user._id, activationToken, isActive: false });
    await auth.save();

    // Send activation email
    const activationUrl = `${process.env.CLIENT_URL}/activate/${activationToken}`;
    await sendEmail(email, 'Account Activation', `Click here to activate: ${activationUrl}`);

    res.status(201).json({ success: true, message: 'User registered. Check email for activation link' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= ACCOUNT ACTIVATION ======= **/
const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const auth = await Auth.findOne({ activationToken: token });

    if (!auth) return res.status(400).json({ success: false, message: 'Invalid activation token' });

    // Activate user account
    auth.isActive = true;
    auth.activationToken = null;
    await auth.save();

    res.status(200).json({ success: true, message: 'Account activated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= LOGIN WITH TOKEN AUTHORIZATION ======= **/
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    // Check if user is active
    const auth = await Auth.findOne({ userId: user._id });
    if (!auth || !auth.isActive) {
      return res.status(403).json({ success: false, message: 'Account not activated. Check your email.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({ success: true, token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= REQUEST PASSWORD RESET ======= **/
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail(email, 'Password Reset Request', `Click here to reset password: ${resetUrl}`);

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= RESET PASSWORD ======= **/
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= UPDATE PROFILE ======= **/
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, email } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Update user profile
    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= DELETE ACCOUNT ======= **/
const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.user;

    // Delete user and authentication record
    await User.findByIdAndDelete(userId);
    await Auth.findOneAndDelete({ userId });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= GET USER DETAILS ======= **/
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { 
  signup, 
  activateAccount, 
  login, 
  requestPasswordReset, 
  resetPassword, 
  updateProfile, 
  deleteAccount, 
  getUserDetails, 
  verifyToken 
};
