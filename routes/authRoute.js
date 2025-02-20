const express = require("express");
const router = express.Router();
const csrf = require("csurf");
const authController = require("../controllers/authController"); // Ensure correct case
const { validateSignup, validateLogin, validateResetPassword } = require("../middleware/auth");

// CSRF Protection Middleware
const csrfProtection = csrf({ cookie: true });

// ** CSRF Token Route ** //
router.get('/csrf-token', csrfProtection, authController.getCsrfToken);

// ** View Routes ** //

// Render the signup page
router.get('/signup', csrfProtection, (req, res) => {
  res.render('auth/signup', { error: null, csrfToken: req.csrfToken() });
});

// Render the login page
router.get("/login", csrfProtection, (req, res) => {
  res.render("auth/login", { csrfToken: req.csrfToken() });
});

// Render the account activation page
router.get("/activate", (req, res) => {
  const activationCode = req.query.code;
  if (!activationCode) {
    return res.status(400).json({ error: "Activation code is required" });
  }
  res.render("auth/activate", { activationCode });
});

// Render the password reset request page
router.get("/passwordreset", csrfProtection, (req, res) => {
  res.render("auth/passwordreset", { csrfToken: req.csrfToken() });
});

// Render the confirm password reset page
router.get("/recoverpwd", csrfProtection, (req, res) => {
  const resetCode = req.query.code;
  if (!resetCode) {
    return res.status(400).json({ error: "Reset code is required" });
  }
  res.render("auth/recoverpwd", { resetCode, csrfToken: req.csrfToken() });
});

// ** API Routes ** //

// Authentication Routes
router.post("/signup", csrfProtection, validateSignup, authController.signup);
router.post("/login", csrfProtection, validateLogin, authController.login);
router.post("/activate", csrfProtection, authController.activateAccount);

// ** Password Reset Routes ** //
router.post("/passwordreset", csrfProtection, authController.requestPasswordReset); // Sends password reset email
router.post("/recoverpwd", csrfProtection, validateResetPassword, authController.resetPassword); // Resets password

// ** Account Management Routes ** //
router.put("/profile", csrfProtection, authController.updateProfile); // Update user profile
router.delete("/delete", csrfProtection, authController.deleteAccount); // Delete user account

// ** Logout Route ** //
router.post("/logout", authController.logout);

// ** Handle email verification via URL token ** //
router.get("/activate/:token", authController.activateAccount);

// ** Tenant-Specific Route (No CSRF needed for GET requests) ** //
router.get("/tenant-data", async (req, res) => {
  try {
    if (!req.tenantSequelize) {
      return res.status(400).json({ error: "Tenant data not available" });
    }

    const [rows] = await req.tenantSequelize.query("SELECT * FROM some_table");
    res.json(rows);
  } catch (err) {
    console.error("Database query error:", err.message);
    res.status(500).json({ error: "Error fetching tenant data" });
  }
});

module.exports = router; // ✅ Export at the end
