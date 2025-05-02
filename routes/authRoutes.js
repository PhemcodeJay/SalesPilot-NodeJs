const express = require('express');
const passport = require('passport');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const {
  signUpController,
  loginController,
  logoutController,
  activateUserController,
  refreshTokenController,
} = require('../controllers/authController');

const {
  validateSignup,
  validateLogin,
  validateActivation,
  validateRefresh,
} = require('../middleware/authvalidator');

const { handleValidationErrors } = require('../middleware/validationErrorHandler');

const router = express.Router();

//
// ✅ Rendered Views
//
router.get('/', tenantMiddleware, (req, res) => res.render('index'));
router.get('/login', tenantMiddleware, (req, res) => res.render('auth/login'));
router.get('/signup', tenantMiddleware, (req, res) => res.render('auth/signup'));
router.get('/logout', tenantMiddleware, (req, res) => res.render('auth/logout'));
router.get('/activate', tenantMiddleware, (req, res) => res.render('auth/activate'));
router.get('/activation-status', tenantMiddleware, (req, res) => res.render('auth/activation-status'));

//
// ✅ Auth Logic (API)
//

/**
 * POST /signup
 * Endpoint for signing up users, validating input and creating user and tenant
 */
router.post('/signup',
  tenantMiddleware,
  validateSignup, // Validation middleware for sign-up
  handleValidationErrors, // Handle errors from validation
  signUpController // Controller to handle sign-up
);

/**
 * POST /login
 * Endpoint for logging in users, validates input and authenticates them
 */
router.post('/login',
  tenantMiddleware,
  validateLogin, // Validation middleware for login
  handleValidationErrors, // Handle errors from validation
  loginController // Controller to handle login
);

/**
 * POST /logout
 * Endpoint for logging out the user and clearing JWT token from cookies
 */
router.post('/logout',
  tenantMiddleware,
  logoutController // Controller to handle logout
);

/**
 * POST /activate
 * Endpoint to activate a user account based on activation code
 */
router.post('/activate',
  tenantMiddleware,
  validateActivation, // Validation for activation request
  handleValidationErrors, // Handle errors from validation
  activateUserController // Controller to handle account activation
);

/**
 * POST /refresh-token
 * Endpoint to refresh the JWT token and provide a new one
 */
router.post('/refresh-token',
  tenantMiddleware,
  validateRefresh, // Validation for refreshing token
  handleValidationErrors, // Handle errors from validation
  refreshTokenController // Controller to handle token refresh
);

//
// ✅ Protected Route using JWT (no session)
// This route is protected by passport JWT authentication
//
router.post('/token-login',
  passport.authenticate('jwt', { session: false }), // JWT authentication
  (req, res) => {
    res.status(200).json({ message: 'Authenticated', user: req.user }); // Send authenticated user details
  }
);

module.exports = router;
