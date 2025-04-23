const express = require('express');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { verifyResetToken } = require('../services/passwordresetService');
const {
  requestPasswordReset,
  resetPassword,
} = require('../controllers/passwordresetController');  // Uses updated password controller

const router = express.Router();

// ✅ Serve Recover Password Page (GET)
router.get('/recoverpwd', (req, res) => {
  res.render('auth/recoverpwd');  // Display form to enter email
});

// ✅ Serve Password Reset Page (GET) using token
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

    // Render password reset form with the valid token
    return res.render('auth/passwordreset', { token });
  } catch (err) {
    console.error('Token validation error:', err);
    return res.render('auth/reset-error', { message: 'Something went wrong. Please try again.' });
  }
});

// ✅ Request password reset email (POST)
router.post('/recoverpwd', requestPasswordReset);  // Sends email with reset token

// ✅ Handle form-based password reset (POST)
router.post('/passwordreset', resetPassword);  // Accepts token and new password

module.exports = router;
