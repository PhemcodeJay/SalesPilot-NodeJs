const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { passwordResetRequest, passwordResetConfirm, signUp, login, logout } = require('../controllers/authController');
const router = express.Router();

// Login Route (with tenant middleware)
router.post('/login', tenantMiddleware, 
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })
);

// Signup Route (Handle user registration)
router.post('/signup', signUp);

// JWT Authentication Route (for token-based authentication)
router.post('/token-login', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

// Password Reset Request Route
router.post('/password-reset-request', passwordResetRequest);

// Password Reset Confirmation Route
router.post('/password-reset-confirm', passwordResetConfirm);

// Logout Route
router.post('/logout', logout);

module.exports = router;
