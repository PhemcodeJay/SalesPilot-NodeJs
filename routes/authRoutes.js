const express = require('express');
const passport = require('passport');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const {
  signUpController,
  loginController,
  logoutController,
  activateUser,
  resendActivationCode // Ensure this function is implemented or remove this route
} = require('../controllers/authController');

const passwordResetRouter = require('./passwordresetRoute');
const router = express.Router();

// Route for account activation (POST to ensure safe handling)
router.post('/activate', activateUser);  // Use POST for account activation

// Serve login page (render the login form)
router.get('/login', (req, res) => {
  res.render('auth/login'); // Ensure auth/login.ejs exists for the login page
});

// Serve signup page (render the signup form)
router.get('/signup', (req, res) => {
  res.render('auth/signup'); // Ensure auth/signup.ejs exists for the signup page
});

// Serve logout page (optional, may just redirect instead)
router.get('/logout', (req, res) => {
  res.render('auth/logout'); // Ensure auth/logout.ejs exists (optional, if using a frontend button)
});

// Route for account activation status (success/failure)
router.get('/activation-status', (req, res, next) => {
  // Calls controller that might render or redirect based on activation status
  activateUser(req, res, next);  // Optionally render or redirect based on activation outcome
  // Alternatively, you can render a static view or redirect
  // res.render('auth/activation-status');  // Static view for showing activation status
});

// Login logic (with tenant middleware)
router.post('/login', tenantMiddleware, loginController);

// Signup logic (to register a new user)
router.post('/signup', signUpController);

// Token-based login (using JWT authentication)
router.post('/token-login', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

// Logout logic (clear the user's session and cookies)
router.post('/logout', logoutController);

// Mount password reset routes (grouping them together under /password-reset)
router.use('/password-reset', passwordResetRouter);

module.exports = router;
