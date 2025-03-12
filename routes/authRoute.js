const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller"); // Ensure correct case
const { validateSignup, validateLogin, validateResetPassword } = require("../middleware/auth");
const authMiddleware = require("../middleware/auth").authenticateUser; // ✅ Fix Import

// ** View Routes ** //
router.get("/sign-up", (req, res) => {
  res.render("auth/signup");
});

router.get("/login", (req, res) => {
  res.render("auth/login");
});

router.get("/activate", (req, res) => {
  const activationCode = req.query.code;
  if (!activationCode) {
    return res.status(400).json({ error: "Activation code is required" });
  }
  res.render("auth/activate", { activationCode });
});

router.get("/passwordreset", (req, res) => {
  res.render("auth/passwordreset");
});

router.get("/recoverpwd", (req, res) => {
  res.render("auth/recoverpwd");
});

// ** API Routes ** //
router.post("/signup", validateSignup, authController.signup);
router.post("/login", validateLogin, authController.login);
router.post("/activate", authController.activateAccount);
router.post("/passwordreset", authController.requestPasswordReset);
router.post("/recoverpwd", validateResetPassword, authController.resetPassword);

// ** Protected Routes ** //
router.put("/profile", authMiddleware, authController.updateProfile); // ✅ Requires authentication
router.delete("/delete", authMiddleware, authController.deleteAccount); // ✅ Requires authentication
router.post("/logout", authMiddleware, authController.logout); // ✅ Requires authentication

// ** Handle email verification via URL token ** //
router.get("/activate/:token", authController.activateAccount);

module.exports = router;
