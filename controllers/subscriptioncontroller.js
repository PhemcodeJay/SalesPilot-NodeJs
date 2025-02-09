const mysql = require('mysql2/promise');
const { DateTime } = require('luxon');
const { Subscription } = require('../models'); // Sequelize model for Subscription
const pool = require('../config/db'); // MySQL Pool for raw queries

// Create a database pool
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'salespilot',
});

// Check and deactivate expired subscriptions
const checkAndDeactivateSubscriptions = async () => {
  try {
    const [subscriptions] = await db.execute(
      'SELECT id, user_id, end_date FROM subscriptions WHERE status = "active"'
    );

    const now = DateTime.now();
    for (const subscription of subscriptions) {
      if (DateTime.fromISO(subscription.end_date) < now) {
        await db.execute('UPDATE subscriptions SET status = "inactive" WHERE id = ?', [subscription.id]);
        console.log(`Subscription ID ${subscription.id} deactivated for User ID ${subscription.user_id}`);
      }
    }
  } catch (error) {
    console.error('Error checking subscriptions:', error.message);
    throw error;
  }
};

// Create a new subscription using Sequelize
const createSubscription = async (userId, planId, paymentDetails) => {
  try {
    return await Subscription.create({
      user_id: userId,
      plan_id: planId,
      payment_details: paymentDetails,
      status: 'active',
      start_date: new Date(),
      end_date: null,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Subscription creation failed');
  }
};

// Get active subscriptions using Sequelize
const getActiveSubscriptions = async (userId) => {
  try {
    return await Subscription.findAll({
      where: { user_id: userId, status: 'active' },
      order: [['start_date', 'DESC']],
    });
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    throw new Error('Unable to fetch active subscriptions');
  }
};

// Cancel a subscription using Sequelize
const cancelSubscription = async (subscriptionId) => {
  try {
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

// Create a free trial subscription using MySQL
const createFreeTrial = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required for a trial.');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 3);

    const query = `
      INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, status, is_free_trial_used)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      userId, 'Trial', startDate.toISOString(), endDate.toISOString(), 'Active', true,
    ]);

    return { id: result.insertId, userId, subscription_plan: 'Trial', start_date: startDate.toISOString(), end_date: endDate.toISOString(), status: 'Active', is_free_trial_used: true };
  } catch (error) {
    console.error(`Error creating trial for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Get an active subscription using MySQL
const getActiveSubscription = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required.');

    const [rows] = await pool.execute('SELECT * FROM subscriptions WHERE user_id = ? AND status = "Active"', [userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Error fetching subscription for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Update a subscription using MySQL
const updateSubscription = async (userId, data) => {
  try {
    if (!userId || !data) throw new Error('User ID and data are required.');

    const query = 'UPDATE subscriptions SET status = ?, end_date = ? WHERE user_id = ?';
    const [result] = await pool.execute(query, [data.status, data.end_date, userId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error updating subscription for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Upgrade a subscription plan using MySQL
const upgradeSubscription = async (userId, newPlan) => {
  try {
    if (!userId || !newPlan) throw new Error('User ID and new plan are required.');

    const query = 'UPDATE subscriptions SET subscription_plan = ?, status = "Active", is_free_trial_used = false WHERE user_id = ? AND status = "Active"';
    const [result] = await pool.execute(query, [newPlan, userId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error upgrading subscription for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Cancel an active subscription using MySQL
const cancelSubscriptionByUserId = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required.');

    const query = 'UPDATE subscriptions SET status = "Cancelled" WHERE user_id = ? AND status = "Active"';
    const [result] = await pool.execute(query, [userId]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error cancelling subscription for user ${userId}: ${error.message}`);
    throw error;
  }
};

// Get subscription status using MySQL
const getSubscriptionStatus = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required.');

    const [rows] = await pool.execute('SELECT * FROM subscriptions WHERE user_id = ? AND status = "Active"', [userId]);

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Error fetching subscription status for user ${userId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  checkAndDeactivateSubscriptions,
  createSubscription,
  getActiveSubscriptions,
  cancelSubscription,
  createFreeTrial,
  getActiveSubscription,
  updateSubscription,
  upgradeSubscription,
  cancelSubscriptionByUserId,
  getSubscriptionStatus,
};
