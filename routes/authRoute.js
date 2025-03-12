const express = require("express");
const router = express.Router();

// Import validation and authentication middleware
const { 
    validateSignup, 
    validateLogin, 
    validateResetPassword, 
    authenticateUser 
} = require("../middleware/auth");

// Import the AuthController where logic is handled
const AuthController = require("../controllers/authcontroller");

// ✅ Public Routes (No authentication required)
// Home page
router.get("/", (req, res) => res.render("home/index"));

// Sign-up page (for new users)
router.get("/sign-up", (req, res) => res.render("auth/signup"));

// Login page (for existing users)
router.get("/login", (req, res) => res.render("auth/login"));

// Password reset request page
router.get("/passwordreset", (req, res) => res.render("auth/passwordreset"));

// Password recovery page (for password reset flow)
router.get("/recoverpwd", (req, res) => res.render("auth/recoverpwd"));

// ✅ Public API Routes (No authentication required)
// Signup Route (POST request to sign up new users)
router.post("/signup", validateSignup, AuthController.signup);

// Login Route (POST request to log in users)
router.post("/login", validateLogin, AuthController.login);

// Account activation Route (POST request with token for activation)
router.post("/activate/:token", AuthController.activateAccount);

// Request password reset (POST request to initiate the reset process)
router.post("/passwordreset", AuthController.requestPasswordReset);

// Reset password (PUT request to actually change the password)
router.put("/recoverpwd", validateResetPassword, AuthController.resetPassword);

// ✅ Protected Routes (Require authentication)

// Dashboard route (only accessible by authenticated users)
router.get("/dashboard", authenticateUser, (req, res) => {
    res.render("dashboard", { user: req.user });  // Pass user info to the dashboard
});


// Update user profile (PUT request for updating profile details)
router.put("/profile", authenticateUser, AuthController.updateProfile);

// Delete user account (DELETE request to remove user account)
router.delete("/delete", authenticateUser, AuthController.deleteAccount);

// Logout route (Invalidate the token and log the user out)
router.post("/logout", authenticateUser, (req, res) => {
    // Token invalidation can be done client-side by deleting the token (e.g., from localStorage or cookies)
    // Optionally, if you are using a token blacklist mechanism, invalidate the token on the server here.
    res.status(200).json({ message: "Logged out successfully" });
});

// Get user details (only accessible by authenticated users)
router.get("/user", authenticateUser, AuthController.getUserDetails);

module.exports = router;
