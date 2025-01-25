const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const { validateSignup, validateLogin, validateResetPassword } = require('../middleware/auth');

// View Routes
// Render the signup page
router.get('/signup', (req, res) => {
  try {
    res.render('auth/signup'); // Render the signup.ejs view
  } catch (error) {
    console.error('Error rendering signup page:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for signup (POST)
router.post('/signup', validateSignup, async (req, res, next) => {
  try {
    await authController.signup(req, res, next);
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for login (POST)
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    await authController.login(req, res, next);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Render the login page
router.get('/login', (req, res) => {
  try {
    res.render('auth/login'); // Render the login.ejs view
  } catch (error) {
    console.error('Error rendering login page:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Render the email activation page
router.get('/activate', (req, res) => {
  try {
    const activationCode = req.query.code; // Get the activation code from the query string
    if (!activationCode) {
      return res.status(400).json({ error: 'Activation code is required' });
    }
    res.render('auth/activate', { activationCode }); // Pass the activation code to the view
  } catch (error) {
    console.error('Error rendering activation page:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Render the password reset request page
router.get('/password-reset', (req, res) => {
  try {
    res.render('auth/passwordreset'); // Render the passwordreset.ejs view
  } catch (error) {
    console.error('Error rendering password reset page:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Render the recover password page
router.get('/recoverpwd', (req, res) => {
  try {
    const resetCode = req.query.code; // Get the reset code from the query string
    if (!resetCode) {
      return res.status(400).json({ error: 'Reset code is required' });
    }
    res.render('auth/recoverpwd', { resetCode }); // Pass the reset code to the view
  } catch (error) {
    console.error('Error rendering recover password page:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API Routes
// Handle user login (POST)
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    await authController.login(req, res, next);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Handle email verification (GET)
router.get('/activate/:token', async (req, res, next) => {
  try {
    await authController.verifyEmail(req, res, next);
  } catch (error) {
    console.error('Email verification error:', error.message);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// Handle password recovery request (POST)
router.post('/recoverpwd', async (req, res, next) => {
  try {
    await authController.recoverpwd(req, res, next);
  } catch (error) {
    console.error('Password recovery error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Handle password reset (POST)
router.post('/passwordreset', async (req, res, next) => {
  try {
    await authController.passwordreset(req, res, next);
  } catch (error) {
    console.error('Password reset error:', error.message);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// Activate Account Route (POST)
router.post('/activate', async (req, res, next) => {
  try {
    await authController.activateAccount(req, res, next);
  } catch (error) {
    console.error('Account activation error:', error.message);
    res.status(400).json({ error: 'Activation failed' });
  }
});

// Example route where we interact with the tenant's database
router.get('/tenant-data', async (req, res) => {
  try {
    // Ensure that tenantSequelize is available for the current tenant
    if (!req.tenantSequelize) {
      return res.status(400).json({ error: 'Tenant data not available' });
    }

    const [rows] = await req.tenantSequelize.query('SELECT * FROM some_table');
    res.json(rows);  // Send tenant-specific data back to the client
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ message: 'Error fetching tenant data' });
  }
});

module.exports = router;
