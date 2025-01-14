// utils/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { body, validationResult } = require('express-validator');
const User = require('../models/user');

// Generate JWT Token
function generateToken(user) {
  const payload = { id: user.id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Verify JWT Token
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(new Error('Invalid or expired token.'));
      } else {
        resolve(decoded);
      }
    });
  });
}

// Middleware to Check Login (via JWT Token)
async function checkLogin(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
      return res.status(403).json({ error: 'Invalid token format.' });
    }

    const decoded = await verifyToken(token);
    req.user = decoded; // Attach user data to request object
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

// Middleware to validate signup data
const validateSignup = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email')
    .isEmail().withMessage('Invalid email format')
    .notEmpty().withMessage('Email is required'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .notEmpty().withMessage('Password is required'),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Invalid phone number format'),
  body('location')
    .notEmpty().withMessage('Location is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware to validate login data
const validateLogin = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .notEmpty().withMessage('Email is required'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Middleware to check if the user is authenticated
const isAuthenticated = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);  // Assuming `id` in payload matches user `_id`
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;  // Attach user object to request for further use
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check user roles (admin, sales, inventory)
const hasRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Middleware for specific roles
const isAdmin = hasRole('admin');
const isSales = hasRole('sales');
const isInventory = hasRole('inventory');

module.exports = { 
  generateToken, 
  verifyToken, 
  checkLogin, 
  validateSignup, 
  validateLogin, 
  isAuthenticated, 
  isAdmin, 
  isSales, 
  isInventory 
};
