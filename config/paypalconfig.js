const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();
const crypto = require('crypto');

const router = express.Router();

// ✅ PayPal Environment Setup
if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET || !process.env.PAYPAL_WEBHOOK_ID) {
    console.error("❌ Missing PayPal API credentials in .env file");
    process.exit(1);
}

const environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

/**
 * ✅ Create a PayPal Order
 */
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        // Validate the provided amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount provided." });
        }

        const orderRequest = new paypal.orders.OrdersCreateRequest();
        orderRequest.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: currency?.toUpperCase() || 'USD',
                    value: amount.toFixed(2),
                },
            }],
        });

        const order = await client.execute(orderRequest);
        console.log("✅ PayPal Order Created:", order.result.id);

        res.json({ id: order.result.id });
    } catch (error) {
        console.error("❌ PayPal Order Creation Error:", error);
        res.status(500).json({ error: 'Something went wrong with PayPal.' });
    }
});

/**
 * ✅ Capture a PayPal Order
 */
router.post('/capture-order', async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: "Missing order ID." });
        }

        const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
        const capture = await client.execute(captureRequest);
        console.log("✅ PayPal Order Captured:", capture.result.id);

        res.json({
            status: capture.result.status,
            details: capture.result,
        });
    } catch (error) {
        console.error("❌ PayPal Capture Error:", error);
        res.status(500).json({ error: 'Unable to capture PayPal order.' });
    }
});

/**
 * ✅ PayPal Webhook Listener (Automatic Payment Updates)
 */
router.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
    try {
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        const body = JSON.stringify(req.body);
        const headers = req.headers;
        
        // Validate webhook signature
        const isValid = verifyWebhookSignature(headers, body, webhookId);
        if (!isValid) {
            return res.status(400).json({ error: "Invalid PayPal webhook signature" });
        }

        const eventType = req.body.event_type;
        console.log(`🔔 PayPal Webhook Event: ${eventType}`);

        switch (eventType) {
            case "PAYMENT.CAPTURE.COMPLETED":
                console.log("✅ Payment completed for:", req.body.resource.id);
                break;
            case "PAYMENT.CAPTURE.DENIED":
                console.log("⚠️ Payment denied for:", req.body.resource.id);
                break;
            default:
                console.log("ℹ️ Other PayPal event received:", eventType);
        }

        res.status(200).json({ status: "Webhook received" });
    } catch (error) {
        console.error("❌ Webhook Error:", error);
        res.status(500).json({ error: 'Webhook processing failed.' });
    }
});

/**
 * ✅ Function to Verify PayPal Webhook Signature
 */
function verifyWebhookSignature(headers, body, webhookId) {
    try {
        const transmissionId = headers["paypal-transmission-id"];
        const timestamp = headers["paypal-transmission-time"];
        const signature = headers["paypal-transmission-sig"];
        const certUrl = headers["paypal-cert-url"];
        const algorithm = "sha256"; // Ensure a valid hashing algorithm

        const expectedSignature = crypto.createHmac(algorithm, process.env.PAYPAL_CLIENT_SECRET)
            .update(`${transmissionId}|${timestamp}|${webhookId}|${body}`)
            .digest("hex");

        return expectedSignature === signature;
    } catch (error) {
        console.error("❌ Webhook Signature Validation Error:", error);
        return false;
    }
}

// ✅ Export Router
module.exports = router;
