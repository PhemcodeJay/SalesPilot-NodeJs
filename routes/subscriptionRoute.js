const express = require('express');
const {
  checkSubscriptionAndProcessPayment,
  getPaymentsByUser,
  getPaymentById,
  updatePaymentStatus,
} = require('../controllers/paycontroller');
const {
  checkAndDeactivateSubscriptions,
  renderPayPage,
  renderSubscriptionPage,
} = require('../controllers/subscriptioncontroller');
const { validateLogin } = require('../middleware/auth');

const router = express.Router();

// ========================
// Subscription Routes
// ========================

const { createSubscription, getActiveSubscriptions, cancelSubscription } = require('../services/subscriptionservice');
const { verifyToken } = require('../config/auth'); // Assuming you have token-based authentication

// Route to create a subscription
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { userId, planId, paymentDetails } = req.body;
        const subscription = await createSubscription(userId, planId, paymentDetails);
        res.status(201).json({ success: true, data: subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route to get active subscriptions for a user
router.get('/active', verifyToken, async (req, res) => {
    try {
        const { userId } = req.query; // Assuming user ID is passed in query params
        const subscriptions = await getActiveSubscriptions(userId);
        res.json({ success: true, data: subscriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route to cancel a subscription
router.post('/cancel', verifyToken, async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        const subscription = await cancelSubscription(subscriptionId);
        res.json({ success: true, data: subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========================
// API Routes
// ========================

// Deactivate expired subscriptions
router.get('/subscriptions/deactivate-expired', validateLogin, async (req, res) => {
  try {
    await checkAndDeactivateSubscriptions();
    res.status(200).json({ message: 'Checked and deactivated expired subscriptions' });
  } catch (error) {
    console.error('Error deactivating expired subscriptions:', error.message);
    res.status(500).json({ error: 'Failed to deactivate expired subscriptions' });
  }
});

// Process payment and check subscription
router.post('/payments/process', validateLogin, checkSubscriptionAndProcessPayment);

// Get payments for a specific user
router.get('/payments/user/:user_id', validateLogin, getPaymentsByUser);

// Get a specific payment by ID
router.get('/payments/:payment_id', validateLogin, getPaymentById);

// Update payment status
router.put('/payments/:payment_id/status', validateLogin, updatePaymentStatus);

// ========================
// Export Router
// ========================
module.exports = router;
