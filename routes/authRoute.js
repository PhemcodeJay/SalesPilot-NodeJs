const express = require("express");
const router = express.Router();

// Import validation and authentication middleware
const { 
    validateSignup, 
    validateLogin, 
    validateResetPassword, 
    authenticateUser 
} = require("../middleware/auth");

const checkSubscription = require("../middleware/checkSubscription");

// Import controllers
const AuthController = require("../controllers/authController");
const { getActiveSubscriptions, createSubscription } = require("../controllers/subscriptioncontroller");

// ✅ Public Routes (No authentication required)
router.get("/", (req, res) => res.render("home/index"));
router.get("/sign-up", (req, res) => res.render("auth/signup"));
router.get("/login", (req, res) => res.render("auth/login"));
router.get("/passwordreset", (req, res) => res.render("auth/passwordreset"));
router.get("/recoverpwd", (req, res) => res.render("auth/recoverpwd"));

// ✅ Public API Routes
router.post("/signup", validateSignup, AuthController.signup);
router.post("/login", validateLogin, AuthController.login);
router.post("/activate/:token", AuthController.activateAccount);
router.post("/passwordreset", AuthController.requestPasswordReset);
router.put("/recoverpwd", validateResetPassword, AuthController.resetPassword);

// ✅ Protected User Routes (Require authentication)
router.get("/dashboard", authenticateUser, (req, res) => {
    res.render("dashboard", { user: req.user });
});
router.put("/profile", authenticateUser, AuthController.updateProfile);
router.delete("/delete", authenticateUser, AuthController.deleteAccount);
router.post("/logout", authenticateUser, (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
});
router.get("/user", authenticateUser, AuthController.getUserDetails);

// ✅ Subscription Routes (Require authentication)
router.get("/subscriptions", authenticateUser, checkSubscription, async (req, res) => {
  try {
    const { id: userId, tenant_id: tenantId } = req.user;
    const subscriptions = await getActiveSubscriptions(userId, tenantId);
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: "Error fetching subscriptions" });
  }
});

router.post("/subscribe", authenticateUser, checkSubscription, async (req, res) => {
  try {
    const { id: userId, tenant_id: tenantId } = req.user;
    const { planId, paymentDetails } = req.body;
    
    const subscription = await createSubscription(userId, tenantId, planId, paymentDetails);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: "Subscription creation failed" });
  }
});

module.exports = router;
