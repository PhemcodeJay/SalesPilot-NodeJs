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
} = require('../controllers/authController'); // Include all updated controllers

const router = express.Router();

// ✅ Serve login page
router.get('/login', (req, res) => {
  res.render('auth/login'); // Ensure auth/login.ejs exists
});

// ✅ Serve signup page
router.get('/signup', (req, res) => {
  res.render('auth/signup'); // Ensure auth/signup.ejs exists
});

// ✅ Serve logout page (optional)
router.get('/logout', (req, res) => {
  res.render('auth/logout'); // Optional view
});

// ✅ Activation page (GET)
router.get('/activate', (req, res) => {
  res.render('auth/activate'); // Show form or message page
});

// ✅ Activation status page (GET)
router.get('/activation-status', (req, res) => {
  res.render('auth/activation-status'); // Show success or error
});

// ✅ Signup logic (POST)
router.post('/signup', signUpController);

// ✅ Login logic with tenant middleware
router.post('/login', tenantMiddleware, loginController);

// ✅ Token-based login using JWT auth
router.post('/token-login', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

// ✅ Logout logic (POST)
router.post('/logout', logoutController);

// ✅ Account activation logic (POST)
router.post('/activate', activateUserController);

// ✅ Password Reset Flow (POST)
router.post('/password-reset/request', passwordResetRequestController);  // Send email
router.post('/password-reset/confirm', passwordResetConfirmController);  // Confirm token + update password

module.exports = router;
