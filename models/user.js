const pool = require('../config/db'); // Database connection
const bcryptUtils = require('../utils/bcryptUtils'); // Utility for password hashing

class UserModel {
  // Create a new user and their subscription
  static async create(userData) {
    try {
      // Validate userData
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data provided.');
      }

      const {
        username,
        email,
        password,
        phone = null,
        role = 'user',
        subscription_plan = null,
        start_date = null,
        end_date = null,
        status = 'active',
        is_free_trial_used = false,
      } = userData;

      // Ensure required fields are provided
      if (!username || !email || !password) {
        throw new Error('Missing required fields: username, email, or password.');
      }

      // Hash the password before inserting it into the database
      const hashedPassword = await bcryptUtils.hashPassword(password);

      // Insert user data into the database
      const userQuery = `
        INSERT INTO users (username, email, password, phone, role) 
        VALUES (?, ?, ?, ?, ?)
      `;
      const [userResults] = await pool.execute(userQuery, [
        username,
        email,
        hashedPassword,
        phone,
        role,
      ]);

      // Check if user creation was successful
      if (!userResults || userResults.affectedRows === 0) {
        throw new Error('Failed to create user.');
      }

      // Insert subscription data (if provided)
      if (subscription_plan || start_date || end_date || status) {
        const subscriptionQuery = `
          INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, status, is_free_trial_used) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [subscriptionResults] = await pool.execute(subscriptionQuery, [
          userResults.insertId,
          subscription_plan,
          start_date,
          end_date,
          status,
          is_free_trial_used,
        ]);

        // Ensure subscription creation was successful
        if (!subscriptionResults || subscriptionResults.affectedRows === 0) {
          throw new Error('Failed to create subscription.');
        }
      }

      return { success: true, userId: userResults.insertId }; // Return success and user ID
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw new Error('Error creating user: ' + error.message);
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      if (!email) throw new Error('Email is required to find a user.');
      const query = 'SELECT * FROM users WHERE email = ?';
      const [results] = await pool.execute(query, [email]);

      if (!Array.isArray(results) || results.length === 0) {
        return null; // No user found
      }

      return results[0];
    } catch (error) {
      console.error('Error finding user by email:', error.message);
      throw new Error('Error finding user by email: ' + error.message);
    }
  }

  // Get user by ID along with subscription data
  static async getById(id) {
    try {
      if (!id) throw new Error('User ID is required.');
      const query = `
        SELECT users.*, subscriptions.* 
        FROM users 
        LEFT JOIN subscriptions ON users.id = subscriptions.user_id 
        WHERE users.id = ?
      `;
      const [results] = await pool.execute(query, [id]);

      if (!Array.isArray(results) || results.length === 0) {
        return null; // No user found
      }

      return results[0];
    } catch (error) {
      console.error('Error retrieving user by ID:', error.message);
      throw new Error('Error retrieving user by ID: ' + error.message);
    }
  }

  // Update user details
  static async update(id, userData) {
    try {
      if (!id) throw new Error('User ID is required for updating.');

      const {
        username,
        email,
        password,
        phone,
        role = 'user',
        subscription_plan,
        start_date,
        end_date,
        status,
      } = userData;

      const updateUserQuery = `
        UPDATE users 
        SET username = ?, email = ?, password = ?, phone = ?, role = ? 
        WHERE id = ?
      `;
      const [userResults] = await pool.execute(updateUserQuery, [
        username || null,
        email || null,
        password ? await bcryptUtils.hashPassword(password) : null, // Hash password if provided
        phone || null,
        role || 'user',
        id,
      ]);

      // Check if user update was successful
      if (!userResults || userResults.affectedRows === 0) {
        throw new Error('Failed to update user.');
      }

      // Update subscription data if provided
      if (subscription_plan || start_date || end_date || status) {
        const updateSubscriptionQuery = `
          UPDATE subscriptions 
          SET subscription_plan = ?, start_date = ?, end_date = ?, status = ? 
          WHERE user_id = ?
        `;
        const [subscriptionResults] = await pool.execute(updateSubscriptionQuery, [
          subscription_plan || null,
          start_date || null,
          end_date || null,
          status || 'active',
          id,
        ]);

        // Check if subscription update was successful
        if (!subscriptionResults || subscriptionResults.affectedRows === 0) {
          throw new Error('Failed to update subscription.');
        }
      }

      return true; // Successfully updated user and subscription
    } catch (error) {
      console.error('Error updating user:', error.message);
      throw new Error('Error updating user: ' + error.message);
    }
  }

  // Delete user along with their subscription data
  static async delete(id) {
    try {
      if (!id) throw new Error('User ID is required for deletion.');

      // Delete subscription data first
      const deleteSubscriptionQuery = 'DELETE FROM subscriptions WHERE user_id = ?';
      const [subscriptionResults] = await pool.execute(deleteSubscriptionQuery, [id]);

      // Delete user data
      const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
      const [userResults] = await pool.execute(deleteUserQuery, [id]);

      // Ensure both user and subscription were deleted
      if (!userResults || userResults.affectedRows === 0) {
        throw new Error('Failed to delete user.');
      }

      return true; // Successfully deleted user and their subscription
    } catch (error) {
      console.error('Error deleting user:', error.message);
      throw new Error('Error deleting user: ' + error.message);
    }
  }

  // Insert activation code for a new user
  static async insertActivationCode(userId, activationCode, expiryDate) {
    try {
      const query = `
        INSERT INTO activation_codes (user_id, code, expiry_date) 
        VALUES (?, ?, ?)
      `;
      await pool.execute(query, [userId, activationCode, expiryDate]);
    } catch (error) {
      console.error('Error inserting activation code:', error.message);
      throw new Error('Error inserting activation code: ' + error.message);
    }
  }

  // Insert password reset token
  static async insertPasswordReset(userId, hashedToken, expiryDate) {
    try {
      const query = `
        INSERT INTO password_resets (user_id, token, expiry_date) 
        VALUES (?, ?, ?)
      `;
      await pool.execute(query, [userId, hashedToken, expiryDate]);
    } catch (error) {
      console.error('Error inserting password reset token:', error.message);
      throw new Error('Error inserting password reset token: ' + error.message);
    }
  }
}

module.exports = UserModel;
