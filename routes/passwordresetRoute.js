const express = require('express');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { verifyResetToken } = require('../services/passwordresetService');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordresetController');
const { validateRecoverPwd, validatePasswordReset } = require('../middleware/authvalidator');
const errorLogger = require('../middleware/errorLogger');

const router = express.Router();

// Serve Recover Password Page (GET)
router.get('/recoverpwd', tenantMiddleware, (req, res) => {
  res.render('auth/recoverpwd');
});

// Serve Password Reset Page (GET) using token
router.get('/passwordreset', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.render('auth/reset-error', { message: 'Missing or invalid reset link.' });
  }

  try {
    const tokenEntry = await verifyResetToken(token);
    if (!tokenEntry) {
      return res.render('auth/reset-error', { message: 'Reset link is invalid or has expired. Please request a new one.' });
    }

    return res.render('auth/passwordreset', { token });
  } catch (err) {
    console.error('Token validation error:', err);
    errorLogger(err, req);
    return res.render('auth/reset-error', { message: 'Something went wrong. Please try again later.' });
  }
});

// Request password reset email (POST)
router.post('/recoverpwd', tenantMiddleware, validateRecoverPwd, requestPasswordReset);

// Handle password reset form (POST)
router.post('/passwordreset', validatePasswordReset, resetPassword);

module.exports = router;
