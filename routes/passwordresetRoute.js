const express = require('express');
const { verifyResetToken } = require('../services/passwordresetService');
const {
  passwordResetRequestController,
  passwordResetConfirmController
} = require('../controllers/authController');

const router = express.Router();

// ✅ Recover password (initial request)
router.get('/recoverpwd', (req, res) => {
  res.render('auth/recoverpwd');
});

// ✅ Securely serve reset password form
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

    // If token is valid, render the reset form with the token
    res.render('auth/passwordreset', { token });
  } catch (err) {
    console.error('Token validation error:', err);
    return res.render('auth/reset-error', { message: 'Something went wrong. Please try again.' });
  }
});

// ✅ Trigger password reset email
router.post('/recoverpwd', passwordResetRequestController);

// ✅ Handle form submission with new password
router.post('/passwordreset', passwordResetConfirmController);

module.exports = router;
