const jwt = require('jsonwebtoken');
const bcryptUtils = require('../utils/bcryptUtils');
const UserModel = require('../models/UserModel');
const mailer = require('../utils/mailer');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  async register(req, res) {
    const { username, email, password } = req.body;

    try {
      const existingUser = await UserModel.findOne('email', email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }

      const result = await UserModel.create({ username, email, password });
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message });
      }

      res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
      console.error('Error during registration:', error.message);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await UserModel.findOne('email', email);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isPasswordValid = await bcryptUtils.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.status(200).json({ success: true, token, user });
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  }

  async activateAccount(req, res) {
    const { activationCode } = req.body;

    try {
      const code = await db('activation_codes').where({ code: activationCode }).first();
      if (!code || code.used) {
        return res.status(400).json({ success: false, message: 'Invalid or expired activation code' });
      }

      await db.transaction(async (trx) => {
        await trx('users').where({ id: code.user_id }).update({ active: true });
        await trx('activation_codes').where({ code: activationCode }).update({ used: true });
      });

      res.status(200).json({ success: true, message: 'Account activated successfully' });
    } catch (error) {
      console.error('Error activating account:', error.message);
      res.status(500).json({ success: false, message: 'Activation failed' });
    }
  }

  async resetPassword(req, res) {
    const { email } = req.body;

    try {
      const user = await UserModel.findOne('email', email);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const resetToken = uuidv4();
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      await db('password_resets').insert({
        user_id: user.id,
        token: resetToken,
        created_at: new Date(),
      });

      await mailer.sendEmail({
        to: email,
        subject: 'Password Reset Request',
        text: `Reset your password using the link: ${resetUrl}`,
      });

      res.status(200).json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
      console.error('Error during password reset:', error.message);
      res.status(500).json({ success: false, message: 'Password reset failed' });
    }
  }
}

module.exports = new AuthController();
