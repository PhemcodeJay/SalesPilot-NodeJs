const User = require('../models/authModel'); // Ensure this matches your authModel export
const Profile = require('../models/profile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Setup mail transporter
const transporter = nodemailer.createTransport({
  service: 'ionos',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to send emails
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};

// Sign up a new user
exports.signup = async (req, res) => {
  const { username, email, password, confirm_password } = req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const user = await User.findUserByEmail(email);
    if (user) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.createUser({ username, email, password: hashedPassword });

    const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const activationLink = `${process.env.BASE_URL}/activate/${token}`;
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
    const user = await User.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(400).json({ error: 'Please verify your email' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify user's email after registration
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await User.verifyUser(decoded.userId);

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('Email verification error:', err.message);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

// Reset password request
exports.recoverpwd = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Email not found' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;
    await sendEmail(email, 'Password Reset Request', `Click the link to reset your password: ${resetLink}`);

    res.status(200).json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Recover password error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password action
exports.passwordreset = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updatePassword(decoded.userId, hashedPassword);

    res.json({ message: 'Password successfully reset' });
  } catch (err) {
    console.error('Password reset error:', err.message);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};
