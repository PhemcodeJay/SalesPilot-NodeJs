const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'your_jwt_secret'; // Ensure 'your_jwt_secret' is a secure fallback

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '1h' });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = { generateToken, verifyToken };
