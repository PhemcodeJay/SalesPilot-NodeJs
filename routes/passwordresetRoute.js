const express = require('express');
const router = express.Router();

const tenantMiddleware = require('../middleware/tenantMiddleware');
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
router.get('/recoverpwd', tenantMiddleware, (req, res) => {
  res.render('auth/recoverpwd');
});

// ✅ GET: Show Reset Form via Token
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

    res.render('auth/passwordreset', { token });
  } catch (err) {
    errorLogger(err, req);
    res.render('auth/reset-error', {
      message: 'Something went wrong. Please try again later.',
    });
  }
});

// ✅ POST: Request Password Reset Email
router.post(
  '/recoverpwd',
  tenantMiddleware,
  validateRecoverPwd,
  requestPasswordReset
);

// ✅ POST: Reset Password via Submitted Form
router.post('/passwordreset', validatePasswordReset, resetPassword);

module.exports = router;
