const jwt = require('jsonwebtoken');
require('dotenv').config();

// Ensure JWT Secret is set
if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Generate JWT Token
function generateToken(user) {
  const payload = { id: user.id, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT Token
async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token.');
  }
}

// Middleware to Check Login
async function checkLogin(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    // Validate token format
    if (!/^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/.test(authHeader)) {
      return res.status(403).json({ error: 'Invalid token format.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = { generateToken, verifyToken, checkLogin };
