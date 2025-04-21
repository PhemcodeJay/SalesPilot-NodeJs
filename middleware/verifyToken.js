const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

module.exports = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user information to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Handle token expiration separately
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    // For any other error (invalid signature, etc.)
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
