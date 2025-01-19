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
    // Validate query object
    if (!query || typeof query !== 'object') {
      throw new Error('Invalid query object provided.');
    }

    let field, value;

    // Handle the case where query uses a "where" clause
    if (query.where && typeof query.where === 'object') {
      const whereKeys = Object.keys(query.where);

      // Ensure the "where" object has exactly one key
      if (whereKeys.length !== 1) {
        throw new Error('"where" object must have exactly one key.');
      }

      field = whereKeys[0]; // Extract the field name
      value = query.where[field]; // Extract the corresponding value
    } else {
      const keys = Object.keys(query);

      // Ensure the query object has exactly one key
      if (keys.length !== 1) {
        throw new Error('Query object must have exactly one key.');
      }

      field = keys[0]; // Extract the field name
      value = query[field]; // Extract the corresponding value
    }

    // Define allowed fields to prevent SQL injection
    const allowedFields = ["id", "username", "email", "phone"]; // Add valid column names here

    // Validate the field against allowed fields
    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid field: ${field}`);
    }

    // Construct and execute the query using parameterized input
    const queryString = `SELECT * FROM users WHERE ${field} = ?`;
    const [results] = await pool.execute(queryString, [value]);

    // Check if results are undefined or not an array
    if (!Array.isArray(results)) {
      console.error('Unexpected response from database:', results);
      throw new Error('Unexpected response from database.');
    }

    // Return null if no user is found
    if (results.length === 0) {
      return null;
    }

    // Return the first matching result
    return results[0];
  } catch (error) {
    // Log the complete error stack for debugging
    console.error(`Error finding user by field '${JSON.stringify(query)}':`, error);
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
