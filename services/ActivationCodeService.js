const bcrypt = require('bcryptjs');
const ActivationCode = require('../models/activationCode');

const verifyActivationCode = async (submittedCode, userId) => {
  const now = new Date();

  const record = await ActivationCode.findOne({
    where: {
      user_id: userId,
      expires_at: { [Op.gt]: now }
    }
  });

  if (!record) {
    throw new Error('No valid activation code found.');
  }

  const isMatch = await bcrypt.compare(submittedCode, record.activation_code);
  if (!isMatch) {
    throw new Error('Invalid activation code.');
  }

  // Optionally activate user and clean up
  await record.destroy(); // Invalidate after use
  return true;
};

module.exports = { verifyActivationCode };
