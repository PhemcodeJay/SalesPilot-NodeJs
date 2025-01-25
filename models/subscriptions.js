const pool = require('./db'); // Assuming this is your database connection module

class Subscription {
  /**
   * Create a free trial subscription for a user
   * @param {Number} userId - The ID of the user
   * @returns {Object} The created subscription details
   * @throws {Error} If the creation fails
   */
  static async createFreeTrial(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required to create a free trial subscription.');
      }

      const startDate = new Date(); // Current date
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + 3); // Add 3 months to the start date

      const query = `
        INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, status, is_free_trial_used)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        userId,
        'Free Trial',
        startDate.toISOString(), // Ensure proper date format
        endDate.toISOString(),   // Ensure proper date format
        'Active',
        true,
      ]);

      return { 
        id: result.insertId, 
        userId, 
        subscription_plan: 'Free Trial', 
        start_date: startDate.toISOString(), 
        end_date: endDate.toISOString(), 
        status: 'Active', 
        is_free_trial_used: true 
      };
    } catch (error) {
      console.error(`Error creating free trial subscription for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch the active subscription of a user
   * @param {Number} userId - The ID of the user
   * @returns {Object|null} The active subscription or null if none exists
   * @throws {Error} If the query fails
   */
  static async getActiveSubscription(userId) {
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
  }

  /**
   * Update the subscription details of a user
   * @param {Number} userId - The ID of the user
   * @param {Object} data - Fields to update (e.g., status, end_date)
   * @returns {Boolean} True if update was successful
   * @throws {Error} If the update fails
   */
  static async updateSubscription(userId, data) {
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
  }

  /**
   * Upgrade a subscription plan for a user
   * @param {Number} userId - The ID of the user
   * @param {String} newPlan - The new subscription plan
   * @returns {Boolean} True if upgrade was successful
   * @throws {Error} If the upgrade fails
   */
  static async upgradeSubscription(userId, newPlan) {
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
  }

  /**
   * Cancel an active subscription for a user
   * @param {Number} userId - The ID of the user
   * @returns {Boolean} True if cancellation was successful
   * @throws {Error} If the cancellation fails
   */
  static async cancelSubscription(userId) {
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
  }

  /**
   * Get the subscription status of a user
   * @param {Number} userId - The ID of the user
   * @returns {Object|null} The active subscription or null if none exists
   * @throws {Error} If the query fails
   */
  static async getSubscriptionStatus(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required to fetch subscription status.');
      }

      const query = 'SELECT * FROM subscriptions WHERE user_id = ? AND status = "Active"';
      const [rows] = await pool.execute(query, [userId]);

      return rows.length > 0 ? rows[0] : null; // Return the subscription if found, else null
    } catch (error) {
      console.error(`Error fetching subscription status for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Subscription;
