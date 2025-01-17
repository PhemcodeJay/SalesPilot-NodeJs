const pool = require('../config/db'); // Database connection
const bcryptUtils = require('../utils/bcryptUtils'); // Utility for password hashing

class UserModel {
  // Create a new user and their subscription
  static async create(userData) {
    try {
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided.');
      }

      const {
        username,
        email,
        password,
        phone = null,
        role = 'sales',
        user_image,
        location,
        subscription_plan = 'trial',
        start_date = null,
        end_date = '2030-12-31 20:59:59',
        status = 'active',
        is_free_trial_used = false,
      } = userData;

      if (!username || !email || !password || !user_image || !location) {
        throw new Error(
          'Missing required fields: username, email, password, user_image, or location.'
        );
      }

      // Check if user with username or email already exists
      const checkUserQuery = `
        SELECT * FROM users WHERE username = ? OR email = ?
      `;
      const [existingUser] = await pool.execute(checkUserQuery, [
        username,
        email,
      ]);

      if (existingUser.length > 0) {
        throw new Error('User with this username or email already exists.');
      }
      
      // Hash the password
      const hashedPassword = await bcryptUtils.hashPassword(password);

      // Insert user into the database
      const userQuery = `
        INSERT INTO users (username, email, password, phone, role, user_image, location, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [userResults] = await pool.execute(userQuery, [
        username,
        email,
        hashedPassword,
        phone,
        role,
        user_image,
        location,
        status,
      ]);

      if (!userResults || userResults.affectedRows === 0) {
        throw new Error('Failed to create user.');
      }

      // Insert subscription details if applicable
      if (subscription_plan || start_date || end_date || status) {
        const subscriptionQuery = `
          INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, status, is_free_trial_used)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [subscriptionResults] = await pool.execute(subscriptionQuery, [
          userResults.insertId,
          subscription_plan,
          start_date || new Date(),
          end_date,
          status,
          is_free_trial_used,
        ]);

        if (!subscriptionResults || subscriptionResults.affectedRows === 0) {
          throw new Error('Failed to create subscription.');
        }
      }

      return { success: true, userId: userResults.insertId };
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Method to find a user by a specific field
static async findOne(query) {
  try {
    if (!query || typeof query !== 'object') {
      throw new Error('Invalid query object provided.');
    }

    const keys = Object.keys(query);
    if (keys.length !== 1) {
      throw new Error('Query object must have exactly one key.');
    }

    const field = keys[0];
    const value = query[field];

    // Use parameterized query to prevent SQL injection
    const queryString = `
      SELECT * FROM users WHERE ${field} = ?
    `;
    const [results] = await pool.execute(queryString, [value]);

    if (results.length === 0) {
      return null; // No user found
    }

    return results[0]; // Return the first result
  } catch (error) {
    console.error(`Error finding user by field '${JSON.stringify(query)}':`, error.message);
    throw new Error(`Error finding user: ${error.message}`);
  }
}


  // Method to get user by ID
  static async getById(userId) {
    try {
      return await this.findOne({ id: userId });
    } catch (error) {
      console.error(`Error getting user by ID: ${error.message}`);
      throw error;
    }
  }

  // Method to update user details
  static async update(userId, userData) {
    try {
      const {
        username,
        email,
        phone,
        role,
        user_image,
        location,
        status,
      } = userData;

      const updateQuery = `
        UPDATE users
        SET username = ?, email = ?, phone = ?, role = ?, user_image = ?, location = ?, status = ?
        WHERE id = ?
      `;

      const [updateResult] = await pool.execute(updateQuery, [
        username,
        email,
        phone,
        role,
        user_image,
        location,
        status,
        userId,
      ]);

      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to update user.');
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error.message);
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Method to delete user
  static async delete(userId) {
    try {
      const deleteQuery = `
        DELETE FROM users WHERE id = ?
      `;

      const [deleteResult] = await pool.execute(deleteQuery, [userId]);

      if (deleteResult.affectedRows === 0) {
        throw new Error('Failed to delete user.');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error.message);
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
}

module.exports = UserModel;
