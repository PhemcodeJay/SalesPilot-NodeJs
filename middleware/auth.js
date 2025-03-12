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

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // Set expiration time
  );
};

// 🔹 Authentication Middleware
function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("🔹 No authorization header found. Rejecting request.");
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.warn("🔹 Invalid or expired token.");
        return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
      }

      req.user = decoded; // Attach decoded user to request
      next(); // ✅ Proceed to next middleware
    });

  } catch (error) {
    console.error("🔹 Authentication error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
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
