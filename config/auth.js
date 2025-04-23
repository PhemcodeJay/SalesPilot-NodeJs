const jwt = require('jsonwebtoken');
const debug = require('debug')('auth');

// Retrieve JWT secrets from environment variables
const accessSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

// Logging warnings if secrets are not defined
if (!accessSecret) {
  console.warn('⚠️ JWT_SECRET is not set in .env — using insecure fallback');
}
if (!refreshSecret) {
  console.warn('⚠️ JWT_REFRESH_SECRET is not set — using insecure fallback');
}

/**
 * Generate short-lived access token
 * @param {Object} payload - Must contain `id` and `role`, can include more
 * @param {String} [expiresIn='15m']
 */
const generateToken = (payload, expiresIn = '15m') => {
  debug(`🔐 Generating access token for user ${payload.id}`);
  return jwt.sign(payload, accessSecret || 'your_jwt_secret', { expiresIn });
};

/**
 * Generate refresh token
 * @param {Object} payload - Typically { id }
 * @param {String} [expiresIn='7d']
 */
const generateRefreshToken = (payload, expiresIn = '7d') => {
  debug(`🔁 Generating refresh token for user ${payload.id}`);
  return jwt.sign(payload, refreshSecret, { expiresIn });
};

/**
 * Verify access token
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, accessSecret || 'your_jwt_secret');
    return decoded;
  } catch (err) {
    debug('❌ Access token error:', err.message);
    throw new Error(err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token');
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, refreshSecret);
    return decoded;
  } catch (err) {
    debug('❌ Refresh token error:', err.message);
    throw new Error(err.name === 'TokenExpiredError' ? 'Refresh token expired' : 'Invalid refresh token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
};
