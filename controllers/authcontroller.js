const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');  // Import UUID package
const User = require('../models/User'); // User Model
const Auth = require('../models/authModel'); // Auth Model
const Subscription = require('../models/subscriptions'); // Subscription Model
const sendEmail = require('../utils/emailUtils'); // Email Utility

/** ======= SIGNUP WITH ACCOUNT ACTIVATION ======= **/
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if the user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(20).toString('hex');

    // Create a unique tenant ID
    const tenantId = uuidv4();  // Generate a unique tenant ID using uuid

    // Check if the 'trial' subscription plan exists in the database
    let defaultSubscription = await Subscription.findOne({ subscription_plan: 'trial' });

    // If no 'trial' subscription is found, create one dynamically
    if (!defaultSubscription) {
      console.log('Default subscription plan (trial) not found, creating a new one.');
      defaultSubscription = await Subscription.create({
        subscription_plan: 'trial',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month trial
        user_id: null, // Initially setting user_id to null
        tenant_id: null, // Initially setting tenant_id to null
      });
    }

    // Create a tenant record for this new user
    const tenant = new Tenant({
      tenantId: tenantId,
      subscriptionId: defaultSubscription._id, // Associate with the 'trial' subscription plan
    });
    await tenant.save();

    // Create the user record and associate the user with the tenant and subscription
    const user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionId: defaultSubscription._id, // Assign the trial subscription ID
      tenantId: tenantId,  // Assign the generated tenant ID to the user
    });
    await user.save();

    // Update the subscription record with user_id and tenant_id
    defaultSubscription.user_id = user._id;  // Set user_id in subscription
    defaultSubscription.tenant_id = tenantId; // Set tenant_id in subscription
    await defaultSubscription.save();  // Save the updated subscription

    // Update the user record to associate the user with the subscription (optional if you want to ensure consistency)
    user.subscriptionId = defaultSubscription._id;
    await user.save();

    // Create a Free Trial subscription for the user using the `createFreeTrial` method
    await Subscription.createFreeTrial(user._id, tenantId); // Create the trial subscription

    // Create an authentication record for the user with the activation token
    const auth = new Auth({
      userId: user._id,
      activationToken,
      isActive: false, // Account is not yet activated
    });
    await auth.save();

    // Send activation email
    const activationUrl = `${process.env.CLIENT_URL}/activate/${activationToken}`;
    await sendEmail(email, 'Account Activation', `Click here to activate: ${activationUrl}`);

    // Respond with a success message
    res.status(201).json({ message: 'User registered, check email for activation link' });
  } catch (error) {
    console.error('Error during signup:', error.message);
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
  requestPasswordReset,
  resetPassword,
  updateProfile,
  deleteAccount,
  getUserDetails,
  logout,
};
