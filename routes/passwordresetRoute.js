const express = require('express');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordresetController');

const router = express.Router();

// Route to request password reset (send email)
router.post('/request-password-reset', requestPasswordReset);

// Route to reset password (with token)
router.post('/reset-password', resetPassword);

module.exports = router;
