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

// Route for account activation
router.post('/activate', activateUser);


// Serve login page
router.get('/login', (req, res) => {
  res.render('auth/login'); // Ensure auth/login.ejs exists
});

// Serve signup page
router.get('/signup', (req, res) => {
  res.render('auth/signup'); // Ensure auth/signup.ejs exists
});

// Serve logout page (optional if using button + JS on frontend)
router.get('/logout', (req, res) => {
  res.render('auth/logout'); // Ensure auth/logout.ejs exists
});

// Serve account activation success/failure page
router.get('/activate', (req, res, next) => {
  // Calls controller that might render or redirect internally
  activateUser(req, res, next); // Optional: Render or redirect based on outcome
  OR: res.render('auth/activate'); // Static view if preferred
});

// Login logic (with tenant middleware)
router.post('/login', tenantMiddleware, loginController);

// Signup logic
router.post('/signup', signUpController);

// Token-based login
router.post('/token-login', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

// Logout logic
router.post('/logout', logoutController);

// Mount password reset routes
router.use('/password-reset', passwordResetRouter);

module.exports = router;
