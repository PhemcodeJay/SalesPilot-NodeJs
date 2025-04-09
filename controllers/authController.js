const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Subscription = require('../models/subscription');
const { generateToken } = require('../config/auth');
const { JWT_SECRET, PASSWORD_RESET_EXPIRATION } = process.env;
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/email'); // Assuming you have an email utility function for sending emails

// SignUp Controller
const signUp = async (req, res) => {
  const { username, email, password, phone, location } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      location,
    });

    // Create a subscription with free trial
    const subscription = await Subscription.create({
      user_id: user.id,
      subscription_plan: 'trial',
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months trial
    });

    const token = generateToken(user);
    res.status(201).json({ message: 'User registered', token });
  } catch (err) {
    res.status(500).json({ error: 'Error registering user' });
  }
};

// Login Controller
const login = async (req, res) => {
  const { email, password, tenant_id } = req.body;

  try {
    // Ensure tenant exists
    const tenant = await Tenant.findOne({ where: { id: tenant_id } });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Fetch user by email and tenant_id
    const user = await User.findOne({ where: { email, tenant_id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout Controller
const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// Password Reset Request Controller
const passwordResetRequest = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    // Generate a reset token with expiration (e.g., 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + (1000 * 60 * 60)); // 1 hour from now

    // Store the reset token and its expiration in the user record (you may want to hash it in real-world apps)
    user.reset_token = resetToken;
    user.reset_token_expiry = resetTokenExpiry;
    await user.save();

    // Send the password reset link to the user's email
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetLink);

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing password reset request' });
  }
};

// Password Reset Confirmation Controller
const passwordResetConfirm = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find user by reset token
    const user = await User.findOne({ where: { reset_token: token } });

    if (!user) {
      return res.status(404).json({ error: 'Invalid or expired reset token' });
    }

    // Check if the reset token has expired
    if (new Date() > user.reset_token_expiry) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear reset token
    user.password = hashedPassword;
    user.reset_token = null;
    user.reset_token_expiry = null;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error resetting password' });
  }
};

module.exports = { signUp, login, logout, passwordResetRequest, passwordResetConfirm };
