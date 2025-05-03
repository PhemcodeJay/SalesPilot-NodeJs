const express = require('express');
const router = express.Router();

const errorLogger = require('../middleware/errorLogger');
const { verifyResetToken } = require('../services/passwordresetService');
const {
  requestPasswordReset,
  resetPassword,
} = require('../controllers/passwordresetController');
const {
  validateRecoverPwd,
  validatePasswordReset,
} = require('../middleware/authvalidator');

// ✅ GET: Show Recover Password Form
// Route: GET /password-reset/recoverpwd
router.get('/recoverpwd', (req, res) => {
  res.render('auth/recoverpwd', { title: 'Recover Password' });
});

// ✅ GET: Show Reset Form via Token
// Route: GET /password-reset/passwordreset?token=...
router.get('/passwordreset', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.render('auth/reset-error', {
      message: 'Missing or invalid reset link.',
    });
  }

  try {
    const tokenEntry = await verifyResetToken(token);
    if (!tokenEntry) {
      return res.render('auth/reset-error', {
        message: 'Reset link is invalid or has expired. Please request a new one.',
      });
    }

    res.render('auth/passwordreset', { title: 'Reset Password', token });
  } catch (err) {
    errorLogger(err, req);
    res.render('auth/reset-error', {
      message: 'Something went wrong. Please try again later.',
    });
  }
});

// ✅ POST: Request Password Reset Email
// Route: POST /password-reset/recoverpwd
router.post('/recoverpwd', validateRecoverPwd, requestPasswordReset);

// ✅ POST: Submit New Password
// Route: POST /password-reset/passwordreset
router.post('/passwordreset', validatePasswordReset, resetPassword);

module.exports = router;
