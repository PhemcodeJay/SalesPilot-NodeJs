const PasswordReset = require('../models/passwordreset');
const { v4: uuidv4 } = require('uuid');

exports.generateResetToken = async (userId) => {
  const code = uuidv4();
  await PasswordReset.create({ userId, code, createdAt: new Date() });
  return { code };
};

exports.verifyResetToken = async (code) => {
  const reset = await PasswordReset.findOne({ code });
  if (!reset) return null;
  // Optionally check expiry here
  return reset;
};
