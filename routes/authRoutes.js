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

// ✅ Views
router.get('/', tenantMiddleware, (req, res) => res.render('index'));
router.get('/login', tenantMiddleware, (req, res) => res.render('auth/login'));
router.get('/signup', tenantMiddleware, (req, res) => res.render('auth/signup'));
router.get('/logout', tenantMiddleware, (req, res) => res.render('auth/logout'));
router.get('/activate', tenantMiddleware, (req, res) => res.render('auth/activate'));
router.get('/activation-status', tenantMiddleware, (req, res) => res.render('auth/activation-status'));

// ✅ Logic Routes (with validation)
router.post('/signup', tenantMiddleware, validateSignup, handleValidationErrors, signUpController);
router.post('/login', tenantMiddleware, validateLogin, handleValidationErrors, loginController);
router.post('/logout', tenantMiddleware, logoutController);
router.post('/activate', tenantMiddleware, validateActivation, handleValidationErrors, activateUserController);
router.post('/refresh-token', tenantMiddleware, validateRefresh, handleValidationErrors, refreshTokenController);

// ✅ JWT Auth
router.post('/token-login', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

module.exports = router;
