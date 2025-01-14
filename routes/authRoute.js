const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  verifyEmail,
  recoverpwd,
  passwordreset,
} = require('../controllers/authcontroller'); // Ensure paths are correct

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
// Handle user sign-up
router.post('/signup', async (req, res, next) => {
  try {
    await signup(req, res, next);
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Handle user login
router.post('/login', async (req, res, next) => {
  try {
    await login(req, res, next);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Handle email verification
router.get('/activate/:token', async (req, res, next) => {
  try {
    await verifyEmail(req, res, next);
  } catch (error) {
    console.error('Email verification error:', error.message);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// Handle password recovery request (send email with reset link)
router.post('/recoverpwd', async (req, res, next) => {
  try {
    await recoverpwd(req, res, next);
  } catch (error) {
    console.error('Password recovery error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Handle password reset (after clicking the reset link)
router.post('/passwordreset', async (req, res, next) => {
  try {
    await passwordreset(req, res, next);
  } catch (error) {
    console.error('Password reset error:', error.message);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
