const { verifyToken } = require('../config/auth'); // Using the verifyToken function from auth.js

/**
 * Middleware to authenticate user based on the presence of a valid JWT in the cookie or header.
 */
const authenticateUser = (req, res, next) => {
  // Try to extract token from HTTP-only cookie
  const cookieToken = req.cookies?.access_token;

  // Fallback to Authorization header if not in cookies
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  const token = cookieToken || headerToken;

  if (!token) {
    // If no token is found, set a flash message and redirect to the login page
    if (!req.flash('error').length) {  // Prevent overwriting an existing flash message
      req.flash('error', 'You must be logged in to access this page.');
    }
    return res.redirect('/login');
  }

  try {
    // Verify the token and attach user payload to the request object
    const decoded = verifyToken(token);
    req.user = decoded; // Attach the decoded user information to request object
    return next(); // Proceed to the requested route
  } catch (err) {
    // If token verification fails, set the flash message and redirect to login
    if (!req.flash('error').length) {  // Prevent overwriting an existing flash message
      req.flash('error', 'Invalid or expired token. Please log in again.');
    }
    return res.redirect('/login');
  }
};

module.exports = authenticateUser;
