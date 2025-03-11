const express = require("express");
const router = express.Router();
const csrf = require("csurf");

const authController = require("../controllers/authcontroller");
const { validateSignup, validateLogin, validateResetPassword } = require("../middleware/auth");
const { authMiddleware } = require("../middleware/auth");
const tenancyMiddleware = require("../middleware/tenancyMiddleware");

// ** CSRF Protection Middleware (Only for state-changing routes) **
const csrfProtection = csrf({ cookie: true });

// ** CSRF Token Route ** //
router.get("/csrf-token", csrfProtection, authController.getCsrfToken);

// ** Public Routes (No Authentication Required) ** //
router.get("/sign-up", csrfProtection, (req, res) => {
  res.render("auth/signup", { csrfToken: req.csrfToken() });
});

router.get("/login", csrfProtection, (req, res) => {
  res.render("auth/login", { csrfToken: req.csrfToken() });
});

router.get("/activate", csrfProtection, (req, res) => {
  const activationCode = req.query.code;
  if (!activationCode) {
    return res.status(400).json({ error: "Activation code is required" });
  }
  res.render("auth/activate", { activationCode });
});

router.get("/passwordreset", csrfProtection, (req, res) => {
  res.render("auth/passwordreset", { csrfToken: req.csrfToken() });
});

router.get("/recoverpwd", csrfProtection, (req, res) => {
  res.render("auth/recoverpwd", { csrfToken: req.csrfToken() });
});

// ** Authentication & Account Management Routes ** //
router.post("/signup", csrfProtection, validateSignup, authController.signup);
router.post("/login", csrfProtection, validateLogin, authController.login);
router.post("/activate", csrfProtection, authController.activateAccount);

router.post("/passwordreset", csrfProtection, authController.requestPasswordReset);
router.post("/recoverpwd", csrfProtection, validateResetPassword, authController.resetPassword);

// ** Profile Update & Account Deletion (Requires Authentication & Tenant Validation) ** //
router.put("/profile", csrfProtection, authMiddleware, tenancyMiddleware, authController.updateProfile);
router.delete("/delete", csrfProtection, authMiddleware, tenancyMiddleware, authController.deleteAccount);

// ** Logout Route (No CSRF needed for logout) ** //
router.post("/logout", authController.logout);

// ** Handle Email Verification via URL Token ** //
router.get("/activate/:token", authController.activateAccount);

// ** Tenant-Specific Route (Requires Authentication & Tenant Connection) ** //
router.get("/tenant-data", authMiddleware, tenancyMiddleware, async (req, res) => {
  try {
    if (!req.sequelize) {
      console.error("[ERROR] Tenant database connection is missing.");
      return res.status(500).json({ error: "Tenant database connection is missing." });
    }

    const [rows] = await req.sequelize.query("SELECT * FROM some_table");
    res.json(rows);
  } catch (err) {
    console.error("[ERROR] Database query error:", err.message);
    res.status(500).json({ error: "Error fetching tenant data." });
  }
});

module.exports = router;
