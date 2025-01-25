const bcryptUtils = require('../utils/bcryptUtils');
const { getTenantDatabase } = require('../config/db');
const pool = require('../config/db'); // Use the pool to interact with the database

class UserModel {
  /**
   * Signup a new user for a specific tenant
   * @param {Object} userData - User data for signup
   * @param {String} tenantDomain - The tenant's domain/subdomain
   * @returns {Object} The created user and subscription details
   * @throws {Error} If signup fails
   */
  static async signup(userData, tenantDomain = 'localhost') { // Default to localhost for tenantDomain
    try {
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided.');
      }

      const {
        username,
        email,
        phone = null,
        password,
        location,
        role = 'sales',
        subscription_plan = 'trial',
        start_date = new Date().toISOString(),
        end_date = '2030-12-31 23:59:59',
        is_free_trial_used = false,
      } = userData;

      if (!username || !email || !password || !location) {
        throw new Error('Missing required fields: username, email, password, or location.');
      }

      // Check if the user already exists
      const existingUser = await this.findOne({ where: { email } }, tenantDomain);
      if (existingUser) {
        throw new Error('A user with the provided email already exists.');
      }

      // Hash the password
      const hashedPassword = await bcryptUtils.hashPassword(password);

      // Insert the user into the database
      const [userResult] = await pool.execute(
        'INSERT INTO users (username, email, phone, password, location, role, tenant_domain) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, email, phone, hashedPassword, location, role, tenantDomain]
      );

      if (!userResult || !userResult.insertId) {
        throw new Error('Failed to create user.');
      }

      const userId = userResult.insertId;

      // Insert the subscription into the database
      const [subscriptionResult] = await pool.execute(
        'INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, is_free_trial_used, tenant_domain) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, subscription_plan, start_date, end_date, is_free_trial_used, tenantDomain]
      );

      if (!subscriptionResult || subscriptionResult.affectedRows === 0) {
        throw new Error('Failed to create subscription.');
      }

      return {
        success: true,
        user: { id: userId, username, email, phone, location, role },
        subscription: { subscription_plan, start_date, end_date, is_free_trial_used },
      };
    } catch (error) {
      console.error('Error during signup:', error.message);
      throw error;
    }
  }

  /**
   * Find a user by specific criteria for a specific tenant or proceed with signup if not found
   * @param {Object} query - Query object with a "where" clause
   * @param {String} tenantDomain - The tenant's domain/subdomain
   * @param {Function} signupCallback - Callback function to execute the signup process
   * @returns {Object|null} The user record or result of the signup process
   * @throws {Error} If the query is invalid
   */
  static async findOne(query, tenantDomain = 'localhost', signupCallback) { // Default tenantDomain to localhost
    try {
      if (!query || typeof query !== 'object' || !query.where) {
        throw new Error('Invalid query object provided.');
      }

      const field = Object.keys(query.where)[0];
      const value = query.where[field];

      // Validate query field
      const allowedFields = ['id', 'username', 'email', 'phone'];
      if (!allowedFields.includes(field)) {
        throw new Error(`Invalid query field: ${field}`);
      }

      const queryString = `SELECT * FROM users WHERE ${field} = ? AND tenant_domain = ?`;
      const [results] = await pool.execute(queryString, [value, tenantDomain]);

      if (results.length > 0) {
        return results[0];
      } else {
        console.log('No user found. Proceeding with signup...');
        if (typeof signupCallback === 'function') {
          return await signupCallback();
        } else {
          throw new Error('Signup callback function not provided.');
        }
      }
    } catch (error) {
      console.error('Error in findOne method:', error.message);
      throw error;
    }
  }

  /**
   * Update user details and subscription for a specific tenant
   * @param {Number} userId - The ID of the user to update
   * @param {Object} data - Fields to update for the user and subscription
   * @param {String} tenantDomain - The tenant's domain/subdomain
   * @returns {Object} Success status
   * @throws {Error} If the update fails
   */
  static async update(userId, data, tenantDomain = 'localhost') { // Default to localhost for tenantDomain
    try {
      if (!userId || !data || typeof data !== 'object') {
        throw new Error('User ID and data are required for update.');
      }

      const { username, email, phone, role, location, subscription_plan, end_date, is_free_trial_used } = data;

      const userFields = { username, email, phone, role, location };
      const userUpdates = Object.keys(userFields).filter(key => userFields[key] !== undefined);

      if (userUpdates.length > 0) {
        const updateQuery = `UPDATE users SET ${userUpdates.map(field => `${field} = ?`).join(', ')} WHERE id = ? AND tenant_domain = ?`;
        await pool.execute(updateQuery, [...userUpdates.map(field => userFields[field]), userId, tenantDomain]);
      }

      if (subscription_plan || end_date || is_free_trial_used !== undefined) {
        const subscriptionFields = { subscription_plan, end_date, is_free_trial_used };
        const subscriptionUpdates = Object.keys(subscriptionFields).filter(key => subscriptionFields[key] !== undefined);

        if (subscriptionUpdates.length > 0) {
          const updateSubscriptionQuery = `UPDATE subscriptions SET ${subscriptionUpdates.map(field => `${field} = ?`).join(', ')} WHERE user_id = ? AND tenant_domain = ?`;
          await pool.execute(updateSubscriptionQuery, [...subscriptionUpdates.map(field => subscriptionFields[field]), userId, tenantDomain]);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in update method:', error.message);
      throw error;
    }
  }
}

module.exports = UserModel;
