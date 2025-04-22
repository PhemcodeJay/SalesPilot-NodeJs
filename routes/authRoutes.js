const express = require('express');
const passport = require('passport');
const tenantMiddleware = require('../middleware/tenantMiddleware');

const {
  signUpController,
  loginController,
  logoutController,
  activateUserController,
  passwordResetRequestController,
  passwordResetConfirmController
} = require('../controllers/authController');

const router = express.Router();

// Use tenantMiddleware on routes that need tenant resolution
router.get('/', tenantMiddleware, (req, res) => {
  res.render('index'); // tenant_id will automatically be available in the view
});

// ✅ Serve login page
router.get('/login', tenantMiddleware, (req, res) => {
  res.render('auth/login'); // tenant_id will automatically be available in the view
});

// ✅ Serve signup page
router.get('/signup', tenantMiddleware, (req, res) => {
  res.render('auth/signup'); // tenant_id will automatically be available in the view
});

// ✅ Serve logout page (optional)
router.get('/logout', tenantMiddleware, (req, res) => {
  res.render('auth/logout'); // tenant_id will automatically be available in the view
});

// ✅ Activation page (GET)
router.get('/activate', tenantMiddleware, (req, res) => {
  res.render('auth/activate'); // tenant_id will automatically be available in the view
});

// ✅ Activation status page (GET)
router.get('/activation-status', tenantMiddleware, (req, res) => {
  res.render('auth/activation-status'); // tenant_id will automatically be available in the view
});

// ✅ Signup logic (POST)
router.post('/signup', tenantMiddleware, signUpController); // tenant_id will automatically be available

// ✅ Login logic with tenant middleware
router.post('/login', tenantMiddleware, loginController); // tenant_id will automatically be available

// ✅ Token-based login using JWT auth
router.post('/token-login', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

// ✅ Logout logic (POST)
router.post('/logout', tenantMiddleware, logoutController); // tenant_id will automatically be available

// ✅ Account activation logic (POST)
router.post('/activate', tenantMiddleware, activateUserController); // tenant_id will automatically be available

// ✅ Password Reset Flow (POST)
router.post('/password-reset/request', tenantMiddleware, passwordResetRequestController);  // tenant_id will automatically be available
router.post('/password-reset/confirm', tenantMiddleware, passwordResetConfirmController);  // tenant_id will automatically be available

module.exports = router;
