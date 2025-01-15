
const bcryptUtils = require('bcryptjs');

// Hash a password
const hashPassword = async (password) => {
  try {
    const salt = await bcryptUtils.genSalt(10); // Generate a salt with 10 rounds
    return await bcryptUtils.hash(password, salt); // Hash the password using the generated salt
  } catch (error) {
    throw new Error('Error hashing the password: ' + error.message);
  }
};

// Compare a password with its hash
const comparePassword = async (password, hash) => {
  try {
    return await bcryptUtils.compare(password, hash); // Compare the password with the hash
  } catch (error) {
    throw new Error('Error comparing passwords: ' + error.message);
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
