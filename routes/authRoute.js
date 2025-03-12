const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");

// Import validation and authentication middleware
const { 
    validateSignup, 
    validateLogin, 
    validateResetPassword, 
    authenticateUser 
} = require("../middleware/auth");

const checkSubscription = require("../middleware/checkSubscription");

// Import controllers
const AuthController = require("../controllers/authcontroller");
const { getActiveSubscriptions, createSubscription } = require("../controllers/subscriptioncontroller");

// ✅ Public Routes (No authentication required)
router.get("/", (req, res) => res.render("home/index"));
router.get("/sign-up", (req, res) => res.render("auth/signup"));
router.get("/login", (req, res) => res.render("auth/login"));
router.get("/passwordreset", (req, res) => res.render("auth/passwordreset"));
router.get("/recoverpwd", (req, res) => res.render("auth/recoverpwd"));

// ✅ Public API Routes
router.post("/signup", validateSignup, asyncHandler(AuthController.signup));
router.post("/login", validateLogin, asyncHandler(AuthController.login));
router.post("/activate/:token", asyncHandler(AuthController.activateAccount));
router.post("/passwordreset", asyncHandler(AuthController.requestPasswordReset));
router.put("/recoverpwd", validateResetPassword, asyncHandler(AuthController.resetPassword));

// ✅ Protected User Routes (Require authentication)
router.get("/dashboard", authenticateUser, (req, res) => {
    res.render("dashboard", { user: req.user });
});
router.put("/profile", authenticateUser, asyncHandler(AuthController.updateProfile));
router.delete("/delete", authenticateUser, asyncHandler(AuthController.deleteAccount));
router.post("/logout", authenticateUser, (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
});

// ✅ Subscription Routes (Require authentication)
router.get("/subscriptions", authenticateUser, checkSubscription, asyncHandler(async (req, res) => {
    const { id: userId, tenant_id: tenantId } = req.user;
    const subscriptions = await getActiveSubscriptions(userId, tenantId);
    res.json(subscriptions);
}));

router.post("/subscribe", authenticateUser, checkSubscription, asyncHandler(async (req, res) => {
    const { id: userId, tenant_id: tenantId } = req.user;
    const { planId, paymentDetails } = req.body;
    
    const subscription = await createSubscription(userId, tenantId, planId, paymentDetails);
    res.json(subscription);
}));

module.exports = router;
