const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Users = require('../models/authModel'); // Ensure this matches your authModel export
const { sendEmail } = require('../utils/emailUtils'); // Utility for sending verification emails

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
  const { username, email, password, confirm_password } = req.body;

  // Check if passwords match
  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // Use the findUserByEmail method to check if the user already exists
    const existingUser = await Users.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = await Users.createUser({
      username,
      email,
      password: hashedPassword,
    });

    // Generate a JWT token for email activation
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const activationLink = `${process.env.BASE_URL}/activate/${token}`;

    // Send an activation email
    await sendEmail(email, 'Account Activation', `Click the link to activate your account: ${activationLink}`);

    res.status(201).json({ message: 'Signup successful. Please check your email for account activation.' });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Log in a user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use the findUserByEmail method to fetch the user by email
    const user = await Users.findUserByEmail(email);

    // If user does not exist or password doesn't match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if the user is active
    if (!user.is_active) {
      return res.status(400).json({ error: 'Please verify your email' });
    }

    // Generate JWT token on successful login
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify user's email
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Call verifyUser method from Users model to activate the account
    await Users.verifyUser(decoded.userId);

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('Email verification error:', err.message);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

// Reset password request
exports.recoverPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Use the findUserByEmail method to check if the user exists
    const user = await Users.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Email not found' });
    }

    // Generate a JWT token for password reset
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;

    // Send reset password email
    await sendEmail(email, 'Password Reset Request', `Click the link to reset your password: ${resetLink}`);

    res.status(200).json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Recover password error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password action
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await Users.updatePassword(decoded.userId, hashedPassword);
    res.status(200).json({ message: 'Password successfully reset' });
  } catch (err) {
    console.error('Password reset error:', err.message);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};
