const { User, Tenant, Subscription, ActivationCode } = require('../models'); // Added Subscription here
const { logError } = require('../utils/logger');
const { generateActivationCode, verifyActivationCode } = require('./ActivationCodeService');
const { createSubscription } = require('./subscriptionService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Sign Up Service
const signUp = async (userData, tenantData) => {
  const transaction = await Tenant.sequelize.transaction();
  try {
    // 1. Create Tenant
    const tenant = await Tenant.create(tenantData, { transaction });

    // 2. Create User with hashed password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
      ...userData,
      tenant_id: tenant.id,
      password: hashedPassword,
      status: EMAIL_ENABLED ? 'inactive' : 'active',
    }, { transaction });

    // 3. Create 3-month trial subscription
    const subscription = await createSubscription(tenant.id, 'trial', transaction);

    // 4. Handle activation
    let activationCode = null;
    if (EMAIL_ENABLED) {
      activationCode = await generateActivationCode(user.id, transaction);
    }

    await transaction.commit();
    return { user, tenant, subscription, activationCode };

  } catch (err) {
    await transaction.rollback();
    logError('signUp service error', err);
    throw new Error('Signup failed. Please try again.');
  }
};

// Login Service
const login = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    if (user.status !== 'active') throw new Error('Account is not activated');

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { user, token };

  } catch (err) {
    logError('login service error', err);
    throw new Error('Login failed. Check your credentials.');
  }
};

// Logout (clears the cookie on controller level)

// Activate User Service
const activateUser = async (activationCode, userId) => {
  try {
    const isValid = await verifyActivationCode(activationCode, userId);
    if (!isValid) throw new Error('Invalid or expired activation code');

    await User.update({ status: 'active' }, { where: { id: userId } });
    return true;

  } catch (err) {
    logError('activateUser service error', err);
    throw new Error('Activation failed');
  }
};

// Refresh Token
const refreshToken = async (oldToken) => {
  try {
    const decoded = jwt.verify(oldToken, JWT_SECRET);
    const { userId, tenantId, role } = decoded;

    const newToken = jwt.sign(
      { userId, tenantId, role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { newToken };

  } catch (err) {
    logError('refreshToken service error', err);
    throw new Error('Token refresh failed');
  }
};

module.exports = {
  signUp,
  login,
  activateUser,
  refreshToken,
};
