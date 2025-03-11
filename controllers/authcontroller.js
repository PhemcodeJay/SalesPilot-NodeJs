const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User'); // Corrected path based on your project structure
const Auth = require('../models/authModel');
const Subscription = require('../models/subscriptionModel'); // Corrected path based on your project structure
const sendEmail = require('../utils/emailUtils'); // Assuming you have a utility to send emails

/** ======= SIGNUP & ACCOUNT ACTIVATION WITH TRIAL SUBSCRIPTION ======= **/
const signup = async (req, res) => {
  try {
    const { username, email, password, phone, location, role, tenantId } = req.body;
    const errors = validationResult(req);

    // Validate input fields
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(20).toString("hex");

    // Create new user (inactive by default)
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      location,
      role,
      isActive: false, // User must activate account
    });

    // Save new user to the database
    await newUser.save();

    // Save activation token
    await Auth.create({
      userId: newUser._id,
      activationToken,
      isActive: false,
    });

    // Create trial subscription for the user
    await Subscription.createFreeTrial(newUser._id, tenantId); // Create trial subscription

    // Send activation email
    const activationUrl = `${process.env.CLIENT_URL}/activate/${activationToken}`;
    await sendEmail(email, "Account Activation", `Click here to activate: ${activationUrl}`);

    res.status(201).json({ message: "User registered, check email for activation link" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/** ======= ACCOUNT ACTIVATION ======= **/
const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const auth = await Auth.findOne({ activationToken: token });

    if (!auth) return res.status(400).json({ message: 'Invalid activation token' });

    await User.findByIdAndUpdate(auth.userId, { isActive: true });
    auth.isActive = true;
    auth.activationToken = null;
    await auth.save();

    res.status(200).json({ message: 'Account activated successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/** ======= LOGIN ======= **/
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
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail(email, 'Password Reset', `Click here to reset your password: ${resetUrl}`);

    res.status(200).json({ message: 'Password reset link sent to your email' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/** ======= RESET PASSWORD ======= **/
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/** ======= UPDATE PROFILE ======= **/
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(userId, { name, email }, { new: true });

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/** ======= DELETE ACCOUNT ======= **/
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndDelete(userId);
    await Auth.findOneAndDelete({ userId });

    res.status(200).json({ message: 'Account deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/** ======= LOGOUT ======= **/
const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
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
  logout,
};
