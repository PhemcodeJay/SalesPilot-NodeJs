const bcryptUtils = require('../utils/bcryptUtils');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Ensure this points to your User model
const { ActivationCode, Subscription } = require('../models/authModel'); // ActivationCode and Subscription models
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');

// Configure mail transporter
const transporter = nodemailer.createTransport({
  service: 'ionos',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class AuthController {
  // User Registration
  async signup(req, res) {
    const { username, email, password, confirm_password, phone, location } = req.body;

    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    try {
      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already signuped' });
      }

      // Hash the password
      const hashedPassword = await bcryptUtils.hashPassword(password);

      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        phone,
        location,
        user_image: req.body.user_image || 'default-image.jpg',
        role: 'sales',
        subscription_plan: 'trial',
        start_date: new Date(),
        end_date: '2030-12-31 20:59:59',
        status: 'active',
        is_free_trial_used: false,
      });

      // Generate activation code
      const activationCode = crypto.randomBytes(20).toString('hex');
      await ActivationCode.create({ user_id: user.id, activation_code: activationCode });

      // Send activation email
      await sendActivationEmail(email, activationCode);

      res.status(201).json({ success: true, message: 'User signuped successfully. Check your email for activation.' });
    } catch (error) {
      console.error('Error during registration:', error.message);
      res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
  }

  // Account Activation
  async activateAccount(req, res) {
    const { activation_code } = req.body;

    try {
      const activationRecord = await ActivationCode.findOne({ where: { activation_code } });
      if (!activationRecord) {
        return res.status(400).json({ success: false, message: 'Invalid activation code' });
      }

      if (new Date(activationRecord.expires_at) < new Date()) {
        return res.status(400).json({ success: false, message: 'Activation code has expired' });
      }

      // Activate user and remove activation code
      await User.update({ status: 'active' }, { where: { id: activationRecord.user_id } });
      await ActivationCode.destroy({ where: { activation_code } });

      res.status(200).json({ success: true, message: 'Account activated successfully' });
    } catch (error) {
      console.error('Error activating account:', error.message);
      res.status(500).json({ success: false, message: 'Server error during activation.' });
    }
  }

  // User Login
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Account is not activated' });
      }

      const isPasswordValid = await bcryptUtils.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: 'Invalid email or password' });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ success: true, token, user });
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  }

  // Request Password Reset
  async requestPasswordReset(req, res) {
    const { email } = req.body;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Email not found' });
      }

      const resetToken = uuidv4();
      await ActivationCode.create({
        user_id: user.id,
        activation_code: resetToken,
        expires_at: new Date(Date.now() + 3600000), // 1 hour
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendPasswordResetEmail(email, resetUrl);

      res.status(200).json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      console.error('Error during password reset request:', error.message);
      res.status(500).json({ success: false, message: 'Server error during password reset request.' });
    }
  }

  // Reset Password
  async resetPassword(req, res) {
    const { reset_code, new_password } = req.body;

    try {
      const resetRecord = await ActivationCode.findOne({ where: { activation_code: reset_code } });
      if (!resetRecord) {
        return res.status(400).json({ success: false, message: 'Invalid reset code' });
      }

      if (new Date(resetRecord.expires_at) < new Date()) {
        return res.status(400).json({ success: false, message: 'Reset code has expired' });
      }

      const hashedPassword = await bcryptUtils.hashPassword(new_password);
      await User.update({ password: hashedPassword }, { where: { id: resetRecord.user_id } });
      await ActivationCode.destroy({ where: { activation_code: reset_code } });

      res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error during password reset:', error.message);
      res.status(500).json({ success: false, message: 'Server error during password reset.' });
    }
  }
}

module.exports = new AuthController();
