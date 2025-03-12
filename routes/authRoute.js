const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller"); // Ensure correct filename casing
const { validateSignup, validateLogin, validateResetPassword, authenticateUser } = require("../middleware/auth");

// ✅ Public Routes (No authentication required)
router.get("/", (req, res) => {
  res.render("home/index");
});
router.get("/sign-up", (req, res) => res.render("auth/signup"));
router.get("/home", (req, res) => res.render("home/index"));
router.get("/login", (req, res) => res.render("auth/login"));
router.get("/passwordreset", (req, res) => res.render("auth/passwordreset"));
router.get("/recoverpwd", (req, res) => res.render("auth/recoverpwd"));

// ✅ Email Activation Route
router.get("/activate", (req, res) => {
  const activationCode = req.query.code;
  if (!activationCode) {
    return res.status(400).json({ error: "Activation code is required" });
  }
  res.render("auth/activate", { activationCode });
});

// ✅ API Routes (No authentication required)
router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.post("/activate/:token", authController.activateAccount);
router.post("/passwordreset", authController.requestPasswordReset);
router.post("/recoverpwd", validateResetPassword, authController.resetPassword);

// ✅ Protected Routes (Require authentication)
router.get("/dashboard", authenticateUser, (req, res) => res.render("dashboard", { user: req.user }));
router.put("/profile", authenticateUser, authController.updateProfile);
router.delete("/delete", authenticateUser, authController.deleteAccount);
router.post("/logout", authenticateUser, (req, res) => res.status(200).json({ message: "Logged out successfully" }));

// ✅ Get user details
router.get("/user", authenticateUser, authController.getUserDetails);

module.exports = router;
