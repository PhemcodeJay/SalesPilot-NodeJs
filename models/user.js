const pool = require('../config/db'); // Database connection
const bcryptUtils = require('../utils/bcryptUtils'); // Utility for password hashing

class UserModel {
  // Create a new user
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
        start_date = null,
        end_date = '2030-12-31 20:59:59',
        is_free_trial_used = false,
      } = userData;

      if (!username || !email || !password || !location) {
        throw new Error('Missing required fields: username, email, password, or location.');
      }

      // Hash the password
      const hashedPassword = await bcryptUtils.hashPassword(password);

      // Insert user into the database
      const userQuery = `
        INSERT INTO users (username, email, phone, password, location, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [userResults] = await pool.execute(userQuery, [
        username,
        email,
        phone,
        hashedPassword,
        location,
        role,
      ]);

      if (!userResults || userResults.affectedRows === 0) {
        throw new Error('Failed to create user.');
      }

      // Insert subscription details if applicable
      if (subscription_plan || start_date || end_date) {
        const subscriptionQuery = `
          INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, is_free_trial_used)
          VALUES (?, ?, ?, ?, ?)
        `;
        const [subscriptionResults] = await pool.execute(subscriptionQuery, [
          userResults.insertId,
          subscription_plan,
          start_date || new Date(),
          end_date,
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

    let field, value;

    if (query.where && typeof query.where === 'object') {
      const whereKeys = Object.keys(query.where);

      if (whereKeys.length !== 1) {
        throw new Error('"where" object must have exactly one key.');
      }

      field = whereKeys[0];
      value = query.where[field];
    } else {
      const keys = Object.keys(query);

      if (keys.length !== 1) {
        throw new Error('Query object must have exactly one key.');
      }

      field = keys[0];
      value = query[field];
    }

    const allowedFields = ["id", "username", "email", "phone"];

    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid field: ${field}`);
    }

    const queryString = `SELECT * FROM users WHERE ${field} = ?`;

    let results;
    try {
      [results] = await pool.execute(queryString, [value]);
      console.log('Database Query Results:', results); // Debugging Log
    } catch (dbError) {
      console.error('Database Query Error:', dbError.message);
      throw new Error('Database query failed.');
    }

    if (!Array.isArray(results)) {
      throw new Error('Database query did not return an array.');
    }

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Error in findOne method: ${error.message}`);
    throw new Error(`Internal Server Error: ${error.message}`);
  }
}


  // Signup method
  static async signup(email, username, phone, password, location) {
    try {
      const existingUser = await this.findOne({ where: { email } });

      if (existingUser) {
        throw new Error('User already exists. Please login instead.');
      }

      const newUser = await this.create({
        email,
        username,
        phone,
        password,
        location,
      });

      return newUser;
    } catch (error) {
      console.error('Error during signup:', error.message);
      throw new Error('Signup failed. Please try again later.');
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
      const { username, email, phone, role, location } = userData;

      const updateQuery = `
        UPDATE users
        SET username = ?, email = ?, phone = ?, role = ?, location = ?
        WHERE id = ?
      `;

      const [updateResult] = await pool.execute(updateQuery, [
        username,
        email,
        phone,
        role,
        location,
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
      const deleteQuery = `DELETE FROM users WHERE id = ?`;

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
