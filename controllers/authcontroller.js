const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/user'); // Ensure this points to your User model
const { ActivationCode, Subscription } = require('../models/authModel'); // Activation and Subscription models
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');

// Configure mail transporter
const transporter = nodemailer.createTransport({
  service: 'ionos',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Sign up a new user
exports.signup = async (req, res) => {
  const { username, email, password, confirm_password, phone, location } = req.body;

  // Check if passwords match
  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // Check if email is already registered
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword, phone, location });

    // Generate an activation code and store it
    const activationCode = crypto.randomBytes(20).toString('hex');
    await ActivationCode.create(newUser.id, activationCode);

    // Send activation email
    sendActivationEmail(email, activationCode);

    res.status(201).json({ message: 'User registered, please check your email for activation' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Activate user account
exports.activateAccount = async (req, res) => {
  const { activation_code } = req.body;

  try {
    const activationRecord = await ActivationCode.findByCode(activation_code);
    if (!activationRecord) {
      return res.status(400).json({ message: 'Invalid activation code' });
    }

    const currentTime = new Date();
    if (new Date(activationRecord.expires_at) < currentTime) {
      return res.status(400).json({ message: 'Activation code has expired' });
    }

    // Activate user and create trial subscription
    await User.activate(activationRecord.user_id);
    await Subscription.createTrial(activationRecord.user_id);
    await ActivationCode.remove(activation_code);

    res.status(200).json({ message: 'Account activated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Log in a user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.is_active) return res.status(400).json({ message: 'Account not activated' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate JWT token on successful login
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request password reset
exports.resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const resetCode = crypto.randomBytes(20).toString('hex');
    await User.createPasswordResetRequest(user.id, resetCode);

    sendPasswordResetEmail(email, resetCode);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Handle password reset action
exports.recoverPassword = async (req, res) => {
  const { reset_code, new_password } = req.body;

  try {
    const resetRequest = await User.findPasswordResetRequest(reset_code);
    if (!resetRequest) return res.status(400).json({ message: 'Invalid reset code' });

    const currentTime = new Date();
    if (new Date(resetRequest.expires_at) < currentTime) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await User.updatePassword(resetRequest.user_id, hashedPassword);
    await User.deletePasswordResetRequest(reset_code);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
