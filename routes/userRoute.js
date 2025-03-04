const express = require('express');
const router = express.Router();
const profileController = require('../controllers/usercontroller'); // Ensure the path to the controller is correct
const { validateLogin } = require('../middleware/auth'); // Import middleware

// Middleware for session handling (optional, depending on your app needs)
const session = require('express-session');
router.use(session({
  secret: 'your_secret_key', // Replace with your secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure to true in production with HTTPS
}));

// Database connection import (ensure it's used if needed in middleware)
const pool = require('../models/db');

// Routes for profile-related actions
router.get('/profile/:userId', validateLogin, profileController.getUserProfile); // Get user profile by ID
router.put('/profile/:userId', validateLogin, profileController.updateUserProfile); // Update user profile by ID
router.delete('/profile/:userId', validateLogin, profileController.deleteUserProfile); // Delete user profile by ID

// Route for subscription status
router.get('/subscription/:userId', validateLogin, profileController.getSubscriptionStatus); // Get subscription status

// Route for payment processing
router.post('/payment', validateLogin, profileController.processPayment); // Process payment and update subscription

module.exports = router;
