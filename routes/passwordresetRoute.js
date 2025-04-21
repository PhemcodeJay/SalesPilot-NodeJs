const express = require('express');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordresetController');

const router = express.Router();

// Serve the password recovery page (form to enter email)
router.get('/recoverpwd', (req, res) => {
  res.render('auth/recoverpwd'); // Ensure recoverpwd.ejs exists in your views folder
});

// Serve the password reset page (form to enter new password)
router.get('/passwordreset', (req, res) => {
  const { token } = req.query; // optional: pass token to the view
  res.render('auth/passwordreset', { token }); // Ensure passwordreset.ejs exists and accepts `token` if needed
});

// Handle password reset request (send email with reset link)
router.post('/recoverpwd', requestPasswordReset);

// Handle password reset form submission (update password)
router.post('/passwordreset', resetPassword);

module.exports = router;
