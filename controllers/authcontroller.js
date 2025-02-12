const bcryptUtils = require('../utils/bcryptUtils');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendActivationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const asyncHandler = require('../middleware/asyncHandler');
const initializeTenantModels = require('../models'); // Dynamic tenant model loader

// **User Signup**
const signup = asyncHandler(async (req, res) => {
  const { tenantDbName, username, email, password, confirm_password, phone, location, user_image } = req.body;

  if (!tenantDbName || !username || !email || !password || !confirm_password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and include letters and numbers.' });
  }

  try {
    const models = await initializeTenantModels(tenantDbName);
    const { User, Tenant, Subscription, ActivationCode, sequelize } = models;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists. Please log in.' });
    }

    const transaction = await sequelize.transaction();
    try {
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 90);

      const tenant = await Tenant.create({ name: `${username}'s Business`, email: normalizedEmail, subscription_end_date: subscriptionEndDate }, { transaction });

      const hashedPassword = await bcryptUtils.hashPassword(password);
      const user = await User.create({
        username,
        email: normalizedEmail,
        password: hashedPassword,
        phone,
        location,
        user_image: user_image || 'default-image.jpg',
        role: 'sales',
        status: 'inactive',
        tenant_id: tenant.id
      }, { transaction });

      await Subscription.create({ user_id: user.id, tenant_id: tenant.id, type: 'trial', start_date: new Date(), end_date: subscriptionEndDate, status: 'active' }, { transaction });

      const activationCode = crypto.randomBytes(20).toString('hex');
      await ActivationCode.create({ user_id: user.id, activation_code: activationCode, expires_at: new Date(Date.now() + 3600000) }, { transaction });

      await transaction.commit();
      await sendActivationEmail(normalizedEmail, activationCode);

      return res.status(201).json({ success: true, message: 'Signup successful. Check your email to activate your account.' });
    } catch (error) {
      await transaction.rollback();
      console.error("Signup Error:", error);
      return res.status(500).json({ success: false, message: 'Signup failed. Try again later.' });
    }
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ success: false, message: 'Error processing request. Try again later.' });
  }
});

// **User Login**
const login = asyncHandler(async (req, res) => {
  const { tenantDbName, email, password } = req.body;

  if (!tenantDbName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const models = await initializeTenantModels(tenantDbName);
    const { User } = models;
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user || !(await bcryptUtils.comparePassword(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not activated. Check your email.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json({ success: true, message: 'Login successful.', token });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: 'Error logging in. Try again later.' });
  }
});

// **Activate Account**
const activateAccount = asyncHandler(async (req, res) => {
  const { tenantDbName, activation_code } = req.body;

  if (!tenantDbName || !activation_code) {
    return res.status(400).json({ success: false, message: 'Tenant database and activation code are required.' });
  }

  try {
    const models = await initializeTenantModels(tenantDbName);
    const { User, ActivationCode } = models;
    const activationRecord = await ActivationCode.findOne({ where: { activation_code } });

    if (!activationRecord) {
      return res.status(400).json({ success: false, message: 'Invalid activation code.' });
    }

    if (new Date(activationRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Activation code expired.' });
    }

    await User.update({ status: 'active' }, { where: { id: activationRecord.user_id } });
    await ActivationCode.destroy({ where: { activation_code } });

    return res.status(200).json({ success: true, message: 'Account activated successfully.' });
  } catch (error) {
    console.error("Activation Error:", error);
    return res.status(500).json({ success: false, message: 'Error activating account.' });
  }
});

// **Request Password Reset**
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { tenantDbName, email } = req.body;

  if (!tenantDbName || !email) {
    return res.status(400).json({ success: false, message: 'Tenant and email are required.' });
  }

  try {
    const models = await initializeTenantModels(tenantDbName);
    const { User, PasswordReset } = models;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    await PasswordReset.create({ user_id: user.id, reset_token: resetToken, expires_at: new Date(Date.now() + 3600000) });

    await sendPasswordResetEmail(email, resetToken);
    return res.status(200).json({ success: true, message: 'Password reset link sent to email.' });
  } catch (error) {
    console.error("Password Reset Error:", error);
    return res.status(500).json({ success: false, message: 'Error processing request.' });
  }
});

// **Confirm Password Reset**
const confirmPasswordReset = asyncHandler(async (req, res) => {
  const { tenantDbName, reset_token, new_password } = req.body;

  if (!tenantDbName || !reset_token || !new_password) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const models = await initializeTenantModels(tenantDbName);
    const { User, PasswordReset } = models;
    const resetRecord = await PasswordReset.findOne({ where: { reset_token } });

    if (!resetRecord || new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    await User.update({ password: await bcryptUtils.hashPassword(new_password) }, { where: { id: resetRecord.user_id } });
    await PasswordReset.destroy({ where: { reset_token } });

    return res.status(200).json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    console.error("Confirm Reset Error:", error);
    return res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
});

module.exports = { signup, login, activateAccount, requestPasswordReset, confirmPasswordReset };
