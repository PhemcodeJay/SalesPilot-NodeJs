const { body } = require('express-validator');

exports.signUpValidation = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('username').notEmpty().withMessage('Username is required'),
  body('tenantName').notEmpty().withMessage('Tenant name is required'),
  // Add more fields if needed
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateSignup = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Phone must be valid'),
  body('tenantName').notEmpty().withMessage('Tenant name is required'),
  body('tenantEmail').isEmail().withMessage('Valid tenant email is required'),
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateActivation = [
  body('action').isIn(['activate', 'resend']).withMessage('Invalid action'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('activationCode').optional(),
  body('userId').optional().isNumeric().withMessage('User ID must be numeric'),
];

exports.validateRefresh = [
  body('oldToken').notEmpty().withMessage('Old token is required'),
];

exports.validateRecoverPwd = [
  body('email').isEmail().withMessage('Valid email is required')
];

exports.validatePasswordReset = [
  body('resetCode').notEmpty().withMessage('Reset code is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];
