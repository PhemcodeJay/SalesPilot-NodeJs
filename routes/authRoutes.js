const express = require('express');
const passport = require('passport');
const tenantMiddleware = require('../middleware/tenantMiddleware');

const {
  signUpController,
  loginController,
  logoutController,
  activateUserController,
  refreshTokenController,
} = require('../controllers/authController'); // Cleaned up: password reset logic removed

const router = express.Router();

// ✅ Serve home/index view
router.get('/', tenantMiddleware, (req, res) => {
  res.render('index'); // tenant_id will automatically be available in the view
});

// ✅ Auth views
router.get('/login', tenantMiddleware, (req, res) => {
  res.render('auth/login');
});

router.get('/signup', tenantMiddleware, (req, res) => {
  res.render('auth/signup');
});

router.get('/logout', tenantMiddleware, (req, res) => {
  res.render('auth/logout');
});

router.get('/activate', tenantMiddleware, (req, res) => {
  res.render('auth/activate');
});

router.get('/activation-status', tenantMiddleware, (req, res) => {
  res.render('auth/activation-status');
});

// ✅ Auth logic (POST)
router.post('/signup', tenantMiddleware, signUpController);
router.post('/login', tenantMiddleware, loginController);
router.post('/logout', tenantMiddleware, logoutController);
router.post('/activate', tenantMiddleware, activateUserController);

// ✅ JWT token-based login
router.post('/token-login', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

// ✅ Refresh token endpoint
router.post('/refresh-token', tenantMiddleware, refreshTokenController);

// ✅ Removed: password reset endpoints now live in passwordRoute.js

module.exports = router;
