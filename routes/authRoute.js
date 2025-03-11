const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller"); // Ensure correct case
const { validateSignup, validateLogin, validateResetPassword } = require("../middleware/auth");

// ** View Routes ** //

// Render the signup page
router.get('/sign-up', (req, res) => {
  res.render('auth/signup');
});

// Render the login page
router.get("/login", (req, res) => {
  res.render("auth/login");
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
router.get("/passwordreset", (req, res) => {
  res.render("auth/passwordreset");
});

// Render the confirm password reset page
router.get("/recoverpwd", (req, res) => {
  res.render("auth/recoverpwd");
});

// ** API Routes ** //

// Authentication Routes
router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.post("/activate", authController.activateAccount);

// ** Password Reset Routes ** //
router.post("/passwordreset", authController.requestPasswordReset); // Sends password reset email
router.post("/recoverpwd", validateResetPassword, authController.resetPassword); // Resets password

// ** Account Management Routes ** //
router.put("/profile", authController.updateProfile); // Update user profile
router.delete("/delete", authController.deleteAccount); // Delete user account

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
