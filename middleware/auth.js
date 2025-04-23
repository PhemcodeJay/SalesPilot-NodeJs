const { verifyToken } = require('../config/auth');

/**
 * Middleware to check if user is authenticated using access_token from either cookie or header.
 */
const isAuthenticated = (req, res, next) => {
  // Try to extract token from HTTP-only cookie
  const cookieToken = req.cookies?.access_token;

  // Fallback to Authorization header if token is not found in cookies
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  // Use the first available token
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const decoded = verifyToken(token); // Verify the token
    req.user = decoded; // Attach user info to request object
    next(); // Continue to the next middleware/route handler
  } catch (err) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }
};

module.exports = isAuthenticated;
