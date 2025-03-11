const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User'); // User Model
const Auth = require('../models/authModel'); // Auth Model
const Subscription = require('../models/subscriptions'); // Subscription Model
const sendEmail = require('../utils/emailUtils'); // Email Utility
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

/** ======= SIGNUP WITH ACCOUNT ACTIVATION ======= **/
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(20).toString('hex');

    const defaultSubscription = await Subscription.findOne({ 
      where: { subscription_plan: 'trial' } 
    });
    
  if (!defaultSubscription) {
    console.log('Default subscription plan not found. Creating a new one...');
    
    const newSubscription = new Subscription({
      subscription_plan: 'trial',
      isActive: true, 
    });

  await newSubscription.save();
  console.log('New trial subscription created:', newSubscription);
}


    const user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionId: defaultSubscription._id, 
    });
    await user.save();

    const auth = new Auth({
      userId: user._id,
      activationToken,
      isActive: false, 
    });
    await auth.save();

    const activationUrl = `${process.env.CLIENT_URL}/activate/${activationToken}`;
    await sendEmail(email, 'Account Activation', `Click here to activate: ${activationUrl}`);

    res.status(201).json({ message: 'User registered, check email for activation link' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= ACCOUNT ACTIVATION ======= **/
const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    let auth = await Auth.findOne({ activationToken: token });

    if (!auth) return res.status(400).json({ message: 'Invalid activation token' });

    auth.isActive = true;
    auth.activationToken = null;
    await auth.save();

    res.status(200).json({ message: 'Account activated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= LOGIN WITH ACTIVATION CHECK ======= **/
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const auth = await Auth.findOne({ userId: user._id });
    if (!auth || !auth.isActive) {
      return res.status(403).json({ message: 'Account is not activated. Check your email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= CSRF PROTECTION ======= **/
const getCsrfToken = (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
};

/** ======= REQUEST PASSWORD RESET ======= **/
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail(email, 'Password Reset Request', `Click here to reset password: ${resetUrl}`);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= RESET PASSWORD ======= **/
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    let user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= UPDATE PROFILE ======= **/
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, email } = req.body;

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= DELETE ACCOUNT ======= **/
const deleteAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    await User.findByIdAndDelete(userId);
    await Auth.findOneAndDelete({ userId });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= GET USER DETAILS ======= **/
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= LOGOUT ======= **/
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

/** ======= EXPORT CONTROLLERS ======= **/
module.exports = {
  signup,
  activateAccount,
  login,
  getCsrfToken,
  csrfProtection,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  deleteAccount,
  getUserDetails,
  logout,
};
