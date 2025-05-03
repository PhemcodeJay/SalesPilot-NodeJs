const { ActivationCode, User } = require('../models');
const { logError } = require('../utils/logger');
const {
  sendActivationEmail,
  canResendActivationCode,
  deleteExpiredActivationCodes,
} = require('../utils/emailUtils');

// Generate and send activation code
const generateActivationCode = async (tenantId) => {
  try {
    // Fetch user associated with the tenant (since user and tenant are the same)
    const user = await User.findOne({ where: { tenant_id: tenantId } });
    if (!user) {
      throw new Error('User (Tenant) not found');
    }

    // Clean up expired codes before generating a new one
    await deleteExpiredActivationCodes();

    // Rate limit: check if a code was sent recently
    const allowed = await canResendActivationCode(user.id);
    if (!allowed) {
      throw new Error('You must wait before requesting another activation code.');
    }

    // Generate an 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10);

    // Save code in the database
    const activationCode = await ActivationCode.create({
      user_id: user.id, // User is associated with the tenant
      code,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send activation email (if email enabled)
    if (process.env.EMAIL_ENABLED !== 'false') {
      await sendActivationEmail(user.email, code);
    }

    return activationCode.code;

  } catch (err) {
    logError('generateActivationCode failed', err);
    throw new Error('Failed to generate activation code.');
  }
};

// Verify activation code
const verifyActivationCode = async (code, tenantId) => {
  try {
    // Fetch user associated with the tenant (since user and tenant are the same)
    const user = await User.findOne({ where: { tenant_id: tenantId } });
    if (!user) {
      throw new Error('User (Tenant) not found');
    }

    const record = await ActivationCode.findOne({
      where: { user_id: user.id, code },
    });

    if (!record) {
      return { success: false, message: 'Activation code not found.' };
    }

    if (new Date(record.expires_at) < new Date()) {
      return { success: false, message: 'Activation code has expired.' };
    }

    return { success: true, message: 'Activation code is valid.' };

  } catch (err) {
    logError('verifyActivationCode failed', err);
    throw new Error('Failed to verify activation code.');
  }
};

// Resend activation code
const resendActivationCode = async (tenantId) => {
  try {
    // Fetch user associated with the tenant (since user and tenant are the same)
    const user = await User.findOne({ where: { tenant_id: tenantId } });
    if (!user) throw new Error('User (Tenant) not found');

    // Respect rate limit
    const allowed = await canResendActivationCode(user.id);
    if (!allowed) {
      throw new Error('You must wait before requesting another activation code.');
    }

    // Clean up and generate new code
    await deleteExpiredActivationCodes();
    const newCode = await generateActivationCode(tenantId);

    console.log(`New activation code sent to ${user.email}: ${newCode}`);
    return newCode;

  } catch (err) {
    logError('resendActivationCode failed', err);
    throw new Error(err.message || 'Failed to resend activation code.');
  }
};

module.exports = {
  generateActivationCode,
  verifyActivationCode,
  resendActivationCode,
};
