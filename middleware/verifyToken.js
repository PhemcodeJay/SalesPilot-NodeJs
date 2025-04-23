const { verifyToken } = require('../config/auth'); // Import verifyToken from config/auth.js

module.exports = (req, res, next) => {
  // Try to extract token from HTTP-only cookie
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Use the verifyToken function from auth.js to verify the token
    const decoded = verifyToken(token); // This will validate the token and decode it
    req.user = decoded; // Attach user information to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    // Handle different types of errors (token expired, invalid token)
    if (err.message === 'Access token expired') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    // For any other error (invalid signature, etc.)
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
