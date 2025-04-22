const express = require('express');
const { verifyResetToken } = require('../services/passwordresetService');  // Importing the password service
const {
  requestPasswordReset,  // Use the updated controller method
  resetPassword         // Use the updated controller method
} = require('../controllers/passwordresetController');  // Updated to use the passwordController

const router = express.Router();

// ✅ Recover password (initial request)
router.get('/recoverpwd', (req, res) => {
  res.render('auth/recoverpwd');  // Ensure that the 'auth/recoverpwd.ejs' file exists
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
router.post('/recoverpwd', requestPasswordReset);  // Send email using controller

// ✅ Handle form submission with new password
router.post('/passwordreset', resetPassword);  // Confirm token + update password using controller

module.exports = router;
