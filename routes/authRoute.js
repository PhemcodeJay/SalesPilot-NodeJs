const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const { validateSignup, validateLogin, validateResetPassword } = require('../middleware/auth');

// ** View Routes ** //

// Render the signup page
router.get('/signup', (req, res) => res.render('auth/signup'));

// Render the login page
router.get('/login', (req, res) => res.render('auth/login'));

// Render the account activation page
router.get('/activate', (req, res) => {
  const activationCode = req.query.code;
  if (!activationCode) {
    return res.status(400).json({ error: 'Activation code is required' });
  }
  res.render('auth/activate', { activationCode });
});

// Render the password reset request page
router.get('/passwordreset', (req, res) => res.render('auth/passwordreset'));

// Render the recover password page
router.get('/recoverpwd', (req, res) => {
  const resetCode = req.query.code;
  if (!resetCode) {
    return res.status(400).json({ error: 'Reset code is required' });
  }
  res.render('auth/recoverpwd', { resetCode });
});

// ** API Routes ** //

// User signup
router.post('/signup', validateSignup, authController.signup);

// User login
router.post('/login', validateLogin, authController.login);

// Activate account (POST)
router.post('/activate', authController.activateAccount);

// Handle email verification (GET)
router.get('/activate/:token', authController.activateAccount);

// Request password reset (send reset email)
router.post('/passwordreset', authController.requestPasswordReset);

// Confirm password reset (POST)
router.post('/recoverpwd', validateResetPassword, authController.confirmPasswordReset);

// ** Tenant-Specific Route **
router.get('/tenant-data', async (req, res) => {
  try {
    if (!req.tenantSequelize) {
      return res.status(400).json({ error: 'Tenant data not available' });
    }

    const [rows] = await req.tenantSequelize.query('SELECT * FROM some_table');
    res.json(rows);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: 'Error fetching tenant data' });
  }
});

module.exports = router;
