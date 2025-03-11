const express = require("express");
const router = express.Router();
const csrf = require("csurf");
const authController = require("../controllers/authcontroller");
const { validateSignup, validateLogin, validateResetPassword } = require("../middleware/auth");

// CSRF Protection Middleware (Only for state-changing routes)
const csrfProtection = csrf({ cookie: true });

// ** CSRF Token Route ** //
router.get("/csrf-token", csrfProtection, authController.getCsrfToken);

// ** View Routes (No CSRF Needed) ** //
router.get("/sign-up", (req, res) => {
  res.render("auth/signup", { csrfToken: req.csrfToken() });
});

router.get("/login", (req, res) => {
  res.render("auth/login", { csrfToken: req.csrfToken() });
});

router.get("/activate", (req, res) => {
  const activationCode = req.query.code;
  if (!activationCode) {
    return res.status(400).json({ error: "Activation code is required" });
  }
  res.render("auth/activate", { activationCode });
});

router.get("/passwordreset", (req, res) => {
  res.render("auth/passwordreset", { csrfToken: req.csrfToken() });
});

router.get("/recoverpwd", (req, res) => {
  res.render("auth/recoverpwd", { csrfToken: req.csrfToken() });
});

// ** API Routes ** //
router.post("/signup", csrfProtection, validateSignup, authController.signup);
router.post("/login", csrfProtection, validateLogin, authController.login);
router.post("/activate", csrfProtection, authController.activateAccount);

// ** Password Reset Routes ** //
router.post("/passwordreset", csrfProtection, authController.requestPasswordReset);
router.post("/recoverpwd", csrfProtection, validateResetPassword, authController.resetPassword);

// ** Account Management Routes ** //
router.put("/profile", csrfProtection, authController.updateProfile);
router.delete("/delete", csrfProtection, authController.deleteAccount);

// ** Logout Route (No CSRF needed for logout) ** //
router.post("/logout", authController.logout);

// ** Handle email verification via URL token ** //
router.get("/activate/:token", authController.activateAccount);

// ** Tenant-Specific Route ** //
router.get("/tenant-data", async (req, res) => {
  try {
    if (!req.sequelize) {
      return res.status(400).json({ error: "Tenant database connection is missing." });
    }

    const [rows] = await req.sequelize.query("SELECT * FROM some_table");
    res.json(rows);
  } catch (err) {
    console.error("[ERROR] Database query error:", err.message);
    res.status(500).json({ error: "Error fetching tenant data." });
  }
});

module.exports = router;
