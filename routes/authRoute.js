const express = require("express");
const router = express.Router();
const { validateSignup, validateLogin, validateResetPassword, authenticateUser } = require("../middleware/auth");
const authController = require("../controllers/authcontroller");

// ✅ Public Routes (No authentication required)
router.get("/", (req, res) => res.render("home/index"));
router.get("/sign-up", (req, res) => res.render("auth/signup"));
router.get("/home", (req, res) => res.render("home/index"));
router.get("/login", (req, res) => res.render("auth/login"));
router.get("/passwordreset", (req, res) => res.render("auth/passwordreset"));
router.get("/recoverpwd", (req, res) => res.render("auth/recoverpwd"));

// ✅ API Routes (No authentication required)
router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.post("/activate/:token", authController.activateAccount);
router.post("/passwordreset", authController.requestPasswordReset);
router.put("/recoverpwd", validateResetPassword, authController.resetPassword); // ✅ Use PUT for updates

// ✅ Protected Routes (Require authentication)
router.get("/dashboard", authenticateUser, (req, res) => res.render("dashboard", { user: req.user }));
router.put("/profile", authenticateUser, authController.updateProfile);
router.delete("/delete", authenticateUser, authController.deleteAccount);

// ✅ Logout (Enhancement: Implement token invalidation if needed)
router.post("/logout", authenticateUser, (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

// ✅ Get user details
router.get("/user", authenticateUser, authController.getUserDetails);

module.exports = router;
