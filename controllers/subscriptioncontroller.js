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
 * Check and deactivate expired subscriptions dynamically
 */
const checkAndDeactivateSubscriptions = async () => {
  try {
    const [subscriptions] = await db.execute(
      'SELECT id, user_id, end_date FROM subscriptions WHERE status = "active"'
    );

    const now = DateTime.now();
    for (const subscription of subscriptions) {
      if (DateTime.fromISO(subscription.end_date) < now) {
        await db.execute(
          'UPDATE subscriptions SET status = "inactive" WHERE id = ?',
          [subscription.id]
        );
        console.log(`Deactivated Subscription ID ${subscription.id} for User ID ${subscription.user_id}`);
      }
    }
  } catch (error) {
    console.error('Error checking subscriptions:', error);
    throw error;
  }
};

/**
 * Create a subscription dynamically (supports Sequelize)
 */
const createSubscription = async (userId, planId, paymentDetails) => {
  try {
    if (!Subscription) {
      throw new Error('Subscription model is not available');
    }
    const subscription = await Subscription.create({
      user_id: userId,
      plan_id: planId,
      payment_details: paymentDetails,
      status: 'active',
      start_date: new Date(),
      end_date: null, // Set end date based on plan duration
    });
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Subscription creation failed');
  }
};

/**
 * Get active subscriptions dynamically (Sequelize)
 */
const getActiveSubscription = async (userId) => {
  try {
    if (!Subscription) {
      throw new Error('Subscription model is not available');
    }
    return await Subscription.findAll({
      where: { user_id: userId, status: 'active' },
      order: [['start_date', 'DESC']],
    });
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    throw new Error('Unable to fetch active subscriptions');
  }
};

/**
 * Cancel a subscription dynamically (Sequelize)
 */
const cancelSubscription = async (subscriptionId) => {
  try {
    if (!Subscription) {
      throw new Error('Subscription model is not available');
    }
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    subscription.status = 'cancelled';
    await subscription.save();
    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw new Error('Subscription cancellation failed');
  }
};

/**
 * Create a free trial using raw MySQL query
 */
const createFreeTrial = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required for a trial.');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 3); // 3 months free trial

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
const createSubscriptionWithDefault = async (userId, planName = "trial") => {
  try {
    if (!userId) throw new Error("User ID is required.");

    // Check if the plan exists
    const [planRows] = await db.execute("SELECT * FROM plans WHERE name = ?", [planName]);
    if (planRows.length === 0) throw new Error("Invalid subscription plan.");

    const plan = planRows[0];

    // Prevent multiple active subscriptions
    const activeSub = await getActiveSubscription(userId);
    if (activeSub.length > 0) throw new Error("User already has an active subscription.");

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

// Export functions
module.exports = {
  checkAndDeactivateSubscriptions,
  createSubscriptionWithDefault, // Renamed function to avoid name conflict
  getActiveSubscription,
  upgradeSubscription,
  cancelSubscriptionByUserId,
  getSubscriptionStatus,
};
