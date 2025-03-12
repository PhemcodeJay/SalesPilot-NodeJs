const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Auth = require('../models/authModel');
const Subscription = require('../models/subscriptions');
const sendEmail = require('../utils/emailUtils');

/** ======= GENERATE JWT TOKEN ======= **/
const generateToken = (userId, tenantId) => {
  return jwt.sign({ userId, tenantId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d', // Default: 7 days
  });
};

/** ======= VERIFY JWT TOKEN MIDDLEWARE ======= **/
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

/** ======= USER SIGNUP ======= **/
const signup = async (req, res) => {
  try {
    const { name, email, password, tenantId } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const assignedTenantId = tenantId || uuidv4();

    // Check if user already exists in the same tenant
    const existingUser = await User.findOne({ email, tenantId: assignedTenantId }).lean();
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists in this tenant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(20).toString('hex');

    // Check if trial subscription exists
    let defaultSubscription = await Subscription.findOne({ subscription_plan: 'trial' }).lean();
    if (!defaultSubscription) {
      defaultSubscription = await Subscription.create({
        subscription_plan: 'trial',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      subscriptionId: defaultSubscription._id,
      tenantId: assignedTenantId,
    });

    // Create authentication record
    await Auth.create({ userId: user._id, activationToken, isActive: false });

    // Send activation email
    const activationUrl = `${process.env.CLIENT_URL}/activate/${activationToken}`;
    await sendEmail(email, 'Account Activation', `Click here to activate: ${activationUrl}`);

    res.status(201).json({ success: true, message: 'User registered. Check email for activation link' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= ACTIVATE ACCOUNT ======= **/
const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const auth = await Auth.findOne({ activationToken: token });

    if (!auth) return res.status(400).json({ success: false, message: 'Invalid activation token' });

    auth.isActive = true;
    auth.activationToken = null;
    await auth.save();

    res.status(200).json({ success: true, message: 'Account activated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= LOGIN ======= **/
const login = async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    if (!tenantId) return res.status(400).json({ success: false, message: 'Tenant ID is required' });

    const user = await User.findOne({ email, tenantId }).lean();
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const auth = await Auth.findOne({ userId: user._id }).lean();
    if (!auth || !auth.isActive) return res.status(403).json({ success: false, message: 'Account not activated' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id, tenantId);
    res.json({ success: true, token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/** ======= REQUEST PASSWORD RESET ======= **/
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000;
    await user.save();

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
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

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
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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

    // Find the user before attempting to delete
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete associated authentication record
    await Auth.findOneAndDelete({ userId });

    // Delete user subscriptions (if applicable)
    await Subscription.deleteMany({ userId });

    // Finally, delete the user
    await User.deleteOne({ _id: userId });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


module.exports = { signup, activateAccount, login, requestPasswordReset, resetPassword, updateProfile, deleteAccount, verifyToken };
