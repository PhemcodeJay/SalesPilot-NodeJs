const bcryptUtils = require('../utils/bcryptUtils');
const { executeQuery } = require('../config/db'); // Import the executeQuery function

class UserModel {

  /**
   * Create a new user record
   * @param {Object} userData - The user data to insert
   * @param {String} tenantDomain - The tenant's domain/subdomain
   * @returns {Object} The created user
   * @throws {Error} If creation fails
   */
  static async create(userData, tenantDomain = 'localhost') {
    try {
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided.');
      }

      const { username, email, phone = null, password, confirm_password, location, role = 'sales' } = userData;

      // Validate password confirmation
      if (password !== confirm_password) {
        throw new Error('Passwords do not match.');
      }

      // Hash the password
      const hashedPassword = await bcryptUtils.hashPassword(password);

      // Insert the user into the database
      const query = `
        INSERT INTO users (username, email, phone, password, confirm_password, location, role, tenant_domain)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const userResult = await executeQuery(query, [username, email, phone, hashedPassword, confirm_password, location, role, tenantDomain]);

      if (!userResult || !userResult.insertId) {
        throw new Error('Failed to create user.');
      }

      return { id: userResult.insertId, username, email, phone, location, role };
    } catch (error) {
      console.error('Error in create method:', error.message);
      throw error;
    }
  }
  
  /**
   * Find a user by a specific field (like username or email) for a specific tenant
   * @param {Object} query - Query object with a "where" clause
   * @param {String} tenantDomain - The tenant's domain/subdomain
   * @returns {Object|null} The user record
   * @throws {Error} If the query is invalid or the query fails
   */
  static async findOne(query, tenantDomain = 'localhost') {
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
      const results = await executeQuery(queryString, [value, tenantDomain]);

      if (results.length > 0) {
        return results[0];
      } else {
        return null; // Return null if no user is found
      }
    } catch (error) {
      console.error('Error in findOne method:', error.message);
      throw error;
    }
  }

  /**
   * Signup a new user for a specific tenant
   * @param {Object} userData - User data for signup
   * @param {String} tenantDomain - The tenant's domain/subdomain
   * @returns {Object} The created user and subscription details
   * @throws {Error} If signup fails
   */
  static async signup(userData, tenantDomain = 'localhost') {
    try {
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided.');
      }

      const {
        username,
        email,
        phone = null,
        password,
        confirm_password,
        location,
        role = 'sales',
        subscription_plan = 'trial',  // Default to 'trial' if not provided
        start_date = new Date().toISOString(),
        end_date = '2030-12-31 23:59:59',  // Set an end date if necessary
        is_free_trial_used = false,
      } = userData;

      // Validate required fields
      if (!username || !email || !password || !location) {
        throw new Error('Missing required fields: username, email, password, or location.');
      }

      // Check if passwords match
      if (password !== confirm_password) {
        throw new Error('Passwords do not match.');
      }

      // Check if the user already exists
      const existingUser = await this.findOne({ where: { email } }, tenantDomain);
      if (existingUser) {
        throw new Error('A user with the provided email already exists.');
      }

      // Hash the password
      const hashedPassword = await bcryptUtils.hashPassword(password);

      // Insert the user into the database
      const query = `
        INSERT INTO users (username, email, phone, password, confirm_password, location, role, tenant_domain)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const userResult = await executeQuery(query, [username, email, phone, hashedPassword, confirm_password, location, role, tenantDomain]);

      if (!userResult || !userResult.insertId) {
        throw new Error('Failed to create user.');
      }

      const userId = userResult.insertId;

      // Automatically assign the trial subscription if 'trial' is the plan
      const subscriptionEndDate = subscription_plan === 'trial' ? '2030-12-31 23:59:59' : end_date;
      const [subscriptionResult] = await executeQuery(
        'INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, is_free_trial_used, tenant_domain) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, subscription_plan, start_date, subscriptionEndDate, is_free_trial_used, tenantDomain]
      );

      if (!subscriptionResult || subscriptionResult.affectedRows === 0) {
        throw new Error('Failed to create subscription.');
      }

      return {
        success: true,
        user: { id: userId, username, email, phone, location, role },
        subscription: { subscription_plan, start_date, end_date: subscriptionEndDate, is_free_trial_used },
      };
    } catch (error) {
      console.error('Error during signup:', error.message);
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
  static async update(userId, data, tenantDomain = 'localhost') {
    try {
      if (!userId || !data || typeof data !== 'object') {
        throw new Error('User ID and data are required for update.');
      }

      const { username, email, phone, role, location, subscription_plan, end_date, is_free_trial_used } = data;

      const userFields = { username, email, phone, role, location };
      const userUpdates = Object.keys(userFields).filter(key => userFields[key] !== undefined);

      if (userUpdates.length > 0) {
        const updateQuery = `UPDATE users SET ${userUpdates.map(field => `${field} = ?`).join(', ')} WHERE id = ? AND tenant_domain = ?`;
        await executeQuery(updateQuery, [...userUpdates.map(field => userFields[field]), userId, tenantDomain]);
      }

      if (subscription_plan || end_date || is_free_trial_used !== undefined) {
        const subscriptionFields = { subscription_plan, end_date, is_free_trial_used };
        const subscriptionUpdates = Object.keys(subscriptionFields).filter(key => subscriptionFields[key] !== undefined);

        if (subscriptionUpdates.length > 0) {
          const updateSubscriptionQuery = `UPDATE subscriptions SET ${subscriptionUpdates.map(field => `${field} = ?`).join(', ')} WHERE user_id = ? AND tenant_domain = ?`;
          await executeQuery(updateSubscriptionQuery, [...subscriptionUpdates.map(field => subscriptionFields[field]), userId, tenantDomain]);
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
