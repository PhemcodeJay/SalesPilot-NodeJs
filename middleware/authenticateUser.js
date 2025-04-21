const passport = require('passport');

const authenticateUser = (req, res, next) => {
  // Check if user is authenticated using Passport.js session
  if (req.isAuthenticated()) {
    return next(); // Proceed to the requested route
  }

  // If not authenticated, set flash message and redirect to login page
  if (!req.flash('error').length) {  // Prevent overwriting an existing flash message
    req.flash('error', 'You must be logged in to access this page.');
  }
  return res.redirect('/login');
};

module.exports = authenticateUser;
