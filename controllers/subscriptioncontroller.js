const mysql = require('mysql2/promise');
const { DateTime } = require('luxon');
const { Subscription } = require('../models'); // Sequelize model for Subscription
const pool = require('../config/db'); // MySQL Pool (if you want to mix in custom queries)

// Create a database pool for better performance with multiple queries
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'salespilot',
});

/**
 * Checks and deactivates expired subscriptions in the database.
 */
const checkAndDeactivateSubscriptions = async () => {
  try {
    // Fetch all active subscriptions with expiration dates
    const [subscriptions] = await db.execute(
      'SELECT id, user_id, end_date FROM subscriptions WHERE status = "active"'
    );

    // Current date for comparison
    const now = DateTime.now();

    for (const subscription of subscriptions) {
      const expirationDate = DateTime.fromISO(subscription.end_date);

      if (expirationDate < now) {
        // Update the subscription status to "inactive"
        await db.execute(
          'UPDATE subscriptions SET status = "inactive" WHERE id = ?',
          [subscription.id]
        );
        console.log(`Subscription ID ${subscription.id} deactivated for User ID ${subscription.user_id}`);
      }
    }
  } catch (error) {
    console.error('Error during subscription check and deactivation:', error.message);
    throw error;
  }
};

// Create a new subscription (with Sequelize)
const createSubscription = async (userId, planId, paymentDetails) => {
    try {
        const subscription = await Subscription.create({
            user_id: userId,
            plan_id: planId,
            payment_details: paymentDetails,
            status: 'active', // Default status, can be changed later
            start_date: new Date(),
            end_date: null, // Set later when subscription ends
        });
        return subscription;
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw new Error('Subscription creation failed');
    }
};

// Get active subscriptions for a user (with Sequelize)
const getActiveSubscriptions = async (userId) => {
    try {
        const subscriptions = await Subscription.findAll({
            where: { user_id: userId, status: 'active' },
            order: [['start_date', 'DESC']], // Most recent subscription first
        });
        return subscriptions;
    } catch (error) {
        console.error('Error fetching active subscriptions:', error);
        throw new Error('Unable to fetch active subscriptions');
    }
};

// Cancel a subscription (with Sequelize)
const cancelSubscription = async (subscriptionId) => {
    try {
        const subscription = await Subscription.findByPk(subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        subscription.status = 'cancelled';
        await subscription.save();
        return subscription;
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw new Error('Subscription cancellation failed');
    }
};

// Create Trial subscription using MySQL Pool (raw query)
const createFreeTrial = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required to create a Trial subscription.');
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + 3); // Add 3 months to the start date

        const query = `
            INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, status, is_free_trial_used)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            userId,
            'Trial',
            startDate.toISOString(),
            endDate.toISOString(),
            'Active',
            true,
        ]);

        return {
            id: result.insertId,
            userId,
            subscription_plan: 'Trial',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'Active',
            is_free_trial_used: true
        };
    } catch (error) {
        console.error(`Error creating Trial subscription for user ${userId}: ${error.message}`);
        throw error;
    }
};

// Get active subscription (MySQL Pool query)
const getActiveSubscription = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required to fetch an active subscription.');
        }

        const query = 'SELECT * FROM subscriptions WHERE user_id = ? AND status = "Active"';
        const [rows] = await pool.execute(query, [userId]);

        return rows.length > 0 ? rows[0] : null; // Return the subscription if found, else null
    } catch (error) {
        console.error(`Error fetching active subscription for user ${userId}: ${error.message}`);
        throw error;
    }
};

// Update a subscription using MySQL Pool (raw query)
const updateSubscription = async (userId, data) => {
    try {
        if (!userId || !data || typeof data !== 'object') {
            throw new Error('User ID and data are required for updating a subscription.');
        }

        const { status, end_date } = data;
        const query = `
            UPDATE subscriptions
            SET status = ?, end_date = ?
            WHERE user_id = ?
        `;

        const [result] = await pool.execute(query, [status, end_date, userId]);
        return result.affectedRows > 0; // Return true if the update was successful
    } catch (error) {
        console.error(`Error updating subscription for user ${userId}: ${error.message}`);
        throw error;
    }
};

// Upgrade a subscription plan for a user (MySQL Pool query)
const upgradeSubscription = async (userId, newPlan) => {
    try {
        if (!userId || !newPlan) {
            throw new Error('User ID and new subscription plan are required to upgrade.');
        }

        const query = `
            UPDATE subscriptions
            SET subscription_plan = ?, status = 'Active', is_free_trial_used = false
            WHERE user_id = ? AND status = 'Active'
        `;

        const [result] = await pool.execute(query, [newPlan, userId]);
        return result.affectedRows > 0; // Return true if the upgrade was successful
    } catch (error) {
        console.error(`Error upgrading subscription for user ${userId}: ${error.message}`);
        throw error;
    }
};

// Cancel an active subscription using MySQL Pool (raw query)
const cancelSubscriptionByUserId = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required to cancel a subscription.');
        }

        const query = `
            UPDATE subscriptions
            SET status = 'Cancelled'
            WHERE user_id = ? AND status = 'Active'
        `;

        const [result] = await pool.execute(query, [userId]);
        return result.affectedRows > 0; // Return true if the cancellation was successful
    } catch (error) {
        console.error(`Error cancelling subscription for user ${userId}: ${error.message}`);
        throw error;
    }
};

// Get the subscription status (MySQL Pool query)
const getSubscriptionStatus = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required to fetch subscription status.');
        }

        const query = `SELECT * FROM subscriptions WHERE user_id = ? AND status = 'Active'`;
        const [rows] = await pool.execute(query, [userId]);

        return rows.length > 0 ? rows[0] : null; // Return the subscription if found, else null
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
