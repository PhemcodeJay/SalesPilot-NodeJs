const mysql = require('mysql2/promise');
const { DateTime } = require('luxon');
const { Subscription } = require('../models'); // Sequelize model for Subscription
const pool = require('../config/db'); // MySQL Pool for raw queries

// Create a database pool (raw queries)
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'salespilot',
});


/**
 * Get an active subscription including plan details
 */
const getActiveSubscription = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required.");

    const query = `
      SELECT s.*, p.name AS plan_name, p.price, p.duration 
      FROM subscriptions s
      JOIN plans p ON s.subscription_plan = p.name
      WHERE s.user_id = ? AND s.status = "Active"
    `;

    const [rows] = await db.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Error fetching subscription for user ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Create a subscription (assign default trial if no plan is provided)
 */
const createSubscription = async (userId, planName = "trial") => {
  try {
    if (!userId) throw new Error("User ID is required.");

    // Check if the plan exists
    const [planRows] = await db.execute("SELECT * FROM plans WHERE name = ?", [planName]);
    if (planRows.length === 0) throw new Error("Invalid subscription plan.");

    const plan = planRows[0];

    // Prevent multiple active subscriptions
    const activeSub = await getActiveSubscription(userId);
    if (activeSub) throw new Error("User already has an active subscription.");

    // Insert new subscription
    const query = `
      INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, status)
      VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), "Active")
    `;
    const [result] = await db.execute(query, [userId, plan.name, plan.duration]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error creating subscription for user ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Upgrade subscription plan
 */
const upgradeSubscription = async (userId, newPlan) => {
  try {
    if (!userId || !newPlan) throw new Error("User ID and new plan are required.");

    // Check if the plan exists
    const [planRows] = await db.execute("SELECT * FROM plans WHERE name = ?", [newPlan]);
    if (planRows.length === 0) throw new Error("Invalid subscription plan.");

    const plan = planRows[0];

    const query = `
      UPDATE subscriptions 
      SET subscription_plan = ?, end_date = DATE_ADD(NOW(), INTERVAL ? DAY), status = "Active"
      WHERE user_id = ? AND status = "Active"
    `;
    const [result] = await db.execute(query, [plan.name, plan.duration, userId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error upgrading subscription for user ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Cancel subscription by user ID
 */
const cancelSubscriptionByUserId = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required.");

    const query = 'UPDATE subscriptions SET status = "Cancelled" WHERE user_id = ? AND status = "Active"';
    const [result] = await db.execute(query, [userId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error cancelling subscription for user ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Get subscription status including plan details
 */
const getSubscriptionStatus = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required.");

    const query = `
      SELECT s.*, p.name AS plan_name, p.price, p.duration 
      FROM subscriptions s
      JOIN plans p ON s.subscription_plan = p.name
      WHERE s.user_id = ? AND s.status = "Active"
    `;

    const [rows] = await db.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Error fetching subscription status for user ${userId}: ${error.message}`);
    throw error;
  }
};

/**
 * Deactivate expired subscriptions
 */
const checkAndDeactivateSubscriptions = async () => {
  try {
    const query = 'UPDATE subscriptions SET status = "Expired" WHERE end_date < NOW() AND status = "Active"';
    await db.execute(query);
    console.log("Expired subscriptions deactivated.");
  } catch (error) {
    console.error("Error deactivating expired subscriptions:", error.message);
  }
};

// Export functions
module.exports = {
  checkAndDeactivateSubscriptions,
  createSubscription,
  getActiveSubscription,
  upgradeSubscription,
  cancelSubscriptionByUserId,
  getSubscriptionStatus,
};
