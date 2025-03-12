const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const tenantConnections = {}; // Store database connections per tenant

// 🔹 Get database connection for a specific tenant
function getTenantDatabase(tenantId) {
  if (!tenantConnections[tenantId]) {
    tenantConnections[tenantId] = new Sequelize(
      `${process.env.DB_NAME}_${tenantId}`,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
      }
    );
  }
  return tenantConnections[tenantId];
}

// 🔹 Get or define a model for the tenant
function getTenantModel(tenantId, modelName) {
  const db = getTenantDatabase(tenantId);

  if (!db.models[modelName]) {
    if (modelName === 'User') {
      db.define('User', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        username: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { 
          type: DataTypes.ENUM('admin', 'sales', 'inventory'), 
          allowNull: false 
        },
        tenantId: { type: DataTypes.INTEGER, allowNull: false },
      });
    }
  }
  return db.models[modelName];
}

// 🔹 Authentication Middleware (JWT Verification)
function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user details to request
    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }
}

// 🔹 Role-Based Access Middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
}

// 🔹 Validation Middleware (Signup)
const validateSignup = [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['admin', 'sales', 'inventory']).withMessage('Invalid role'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// 🔹 Validation Middleware (Login)
const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// 🔹 Validation Middleware (Reset Password)
const validateResetPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Export middleware functions
module.exports = { 
  getTenantDatabase, 
  getTenantModel, 
  authenticateUser,
  authorizeRoles,
  validateSignup, 
  validateLogin, 
  validateResetPassword 
};
