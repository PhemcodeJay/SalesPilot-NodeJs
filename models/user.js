const pool = require('../config/db');
const bcryptUtils = require('../utils/bcryptUtils');

class UserModel {
  /**
   * Create a new user and their subscription details
   * @param {Object} userData - User data to insert into the database
   * @returns {Object} The created user and subscription details
   * @throws {Error} If user creation fails
   */
  static async create(userData) {
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

      // Check if the email already exists
      const existingUser = await this.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('A user with the provided email already exists.');
      }

      // Hash the password
      const hashedPassword = await bcryptUtils.hashPassword(password);

      // Insert user into the database
      const [userResult] = await pool.execute(
        'INSERT INTO users (username, email, phone, password, location, role) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, phone, hashedPassword, location, role]
      );

      // Ensure user result contains insertId
      if (!userResult || !userResult.insertId) {
        throw new Error('Failed to create user.');
      }

      const userId = userResult.insertId;

      // Add subscription details
      const [subscriptionResult] = await pool.execute(
        'INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, is_free_trial_used) VALUES (?, ?, ?, ?, ?)',
        [userId, subscription_plan, start_date, end_date, is_free_trial_used]
      );

      // Ensure subscription result contains affectedRows
      if (!subscriptionResult || subscriptionResult.affectedRows === 0) {
        throw new Error('Failed to create subscription.');
      }

      return {
        success: true,
        user: { id: userId, username, email, phone, location, role },
        subscription: { subscription_plan, start_date, end_date, is_free_trial_used },
      };
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  }

  /**
   * Find a user by specific criteria
   * @param {Object} query - Query object with a "where" clause
   * @returns {Object|null} The user record or null if not found
   * @throws {Error} If the query is invalid
   */
  static async findOne(query) {
    try {
      if (!query || typeof query !== 'object' || !query.where) {
        throw new Error('Invalid query object provided.');
      }

      const field = Object.keys(query.where)[0];
      const value = query.where[field];

      const allowedFields = ['id', 'username', 'email', 'phone'];
      if (!allowedFields.includes(field)) {
        throw new Error(`Invalid query field: ${field}`);
      }

      const [results] = await pool.execute(`SELECT * FROM users WHERE ${field} = ?`, [value]);

      if (!results || results.length === 0) {
        return null;
      }

      return results[0];
    } catch (error) {
      console.error('Error in findOne method:', error.message);
      throw error;
    }
  }

  /**
   * Update user details and subscription
   * @param {Number} userId - The ID of the user to update
   * @param {Object} data - Fields to update for the user and subscription
   * @returns {Object} Success status
   * @throws {Error} If the update fails
   */
  static async update(userId, data) {
    try {
      if (!userId || !data || typeof data !== 'object') {
        throw new Error('User ID and data are required for update.');
      }

      const { username, email, phone, role, location, subscription_plan, end_date, is_free_trial_used } = data;

      // Update user details
      const userFields = { username, email, phone, role, location };
      const userUpdates = Object.keys(userFields).filter(key => userFields[key] !== undefined);
      if (userUpdates.length > 0) {
        const updateQuery = `
          UPDATE users
          SET ${userUpdates.map(field => `${field} = ?`).join(', ')}
          WHERE id = ?
        `;
        const updateValues = [...userUpdates.map(field => userFields[field]), userId];
        const [result] = await pool.execute(updateQuery, updateValues);

        if (result.affectedRows === 0) {
          throw new Error('Failed to update user details.');
        }
      }

      // Update subscription details
      const subscriptionFields = { subscription_plan, end_date, is_free_trial_used };
      const subscriptionUpdates = Object.keys(subscriptionFields).filter(key => subscriptionFields[key] !== undefined);
      if (subscriptionUpdates.length > 0) {
        const subscriptionQuery = `
          UPDATE subscriptions
          SET ${subscriptionUpdates.map(field => `${field} = ?`).join(', ')}
          WHERE user_id = ?
        `;
        const subscriptionValues = [...subscriptionUpdates.map(field => subscriptionFields[field]), userId];
        const [subResult] = await pool.execute(subscriptionQuery, subscriptionValues);

        if (subResult.affectedRows === 0) {
          throw new Error('Failed to update subscription details.');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in update method:', error.message);
      throw error;
    }
  }

  /**
   * Delete a user and their subscription
   * @param {Number} userId - The ID of the user to delete
   * @returns {Object} Success status
   * @throws {Error} If the deletion fails
   */
  static async delete(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required for deletion.');
      }

      const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
      const deleteSubscriptionQuery = 'DELETE FROM subscriptions WHERE user_id = ?';

      await pool.execute(deleteSubscriptionQuery, [userId]);
      const [result] = await pool.execute(deleteUserQuery, [userId]);

      if (result.affectedRows === 0) {
        throw new Error('Failed to delete user.');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error.message);
      throw error;
    }
  }

  /**
   * Signup a new user
   * @param {Object} userData - User data for signup
   * @returns {Object} The created user and subscription details
   * @throws {Error} If signup fails
   */
  static async signup(userData) {
    try {
      const { email } = userData;

      // Check if the user already exists
      const existingUser = await this.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('User already exists. Please log in instead.');
      }

      // Create a new user
      return await this.create(userData);
    } catch (error) {
      console.error('Error during signup:', error.message);
      throw error;
    }
  }
}

module.exports = UserModel;

