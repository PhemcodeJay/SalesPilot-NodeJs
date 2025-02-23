const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const { body, validationResult } = require('express-validator');

const tenantConnections = {}; // Store connections per tenant

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
          type: DataTypes.ENUM('admin', 'sales', 'manager'), 
          allowNull: false 
        },
        tenantId: { type: DataTypes.INTEGER, allowNull: false },
      });
    }
  }
  
  return db.models[modelName];
}

// Middleware for validating user signup
const validateSignup = [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'sales', 'inventory'])
    .withMessage('Invalid role'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Middleware for validating user login
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

// Middleware for validating password reset
const validateResetPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { 
  getTenantDatabase, 
  getTenantModel, 
  validateSignup, 
  validateLogin, 
  validateResetPassword 
};
