const jwt = require('jsonwebtoken');
require('dotenv').config();

// ✅ Environment setup
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable.');
}

// ✅ Generate JWT Token
function generateToken(user) {
  const payload = { id: user.id, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ✅ Verify JWT Token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token.');
  }
}

// ✅ Middleware to check login
function checkLogin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

// ✅ Export utilities
module.exports = {
  generateToken,
  verifyToken,
  checkLogin
};
