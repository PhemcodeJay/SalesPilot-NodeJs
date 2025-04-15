const express = require('express');
const passport = require('passport');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const {
  signUpController,
  loginController,
  logoutController,
  passwordResetRequestController,
  passwordResetConfirmController
} = require('../controllers/authController'); // Updated with new controller imports

const router = express.Router();

// Login Route (with tenant middleware)
router.post('/login', tenantMiddleware, loginController);

// Signup Route (Handle user registration, with rate limiting)
router.post('/signup', signUpController);

// JWT Authentication Route (for token-based authentication)
router.post('/token-login', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

// Password Reset Request Route
router.post('/password-reset-request', passwordResetRequestController);

// Password Reset Confirmation Route
router.post('/password-reset-confirm', passwordResetConfirmController);

// Logout Route
router.post('/logout', logoutController);

module.exports = router;
