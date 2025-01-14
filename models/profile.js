const db = require('../config/db'); // Assuming you have a database connection

class User {
  // Create a new user along with a subscription
  static async create(userData) {
    const query = 'INSERT INTO users (username, email, password, phone, role, trial_end_date) VALUES (?, ?, ?, ?, ?, ?)';
    const [userResults] = await db.execute(query, [
      userData.username,
      userData.email,
      userData.password,
      userData.phone,
      userData.role,
      userData.trial_end_date,
    ]);

    // Insert subscription data for the new user
    const subscriptionQuery = 'INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, status, is_free_trial_used) VALUES (?, ?, ?, ?, ?, ?)';
    await db.execute(subscriptionQuery, [
      userResults.insertId,
      userData.subscription_plan,
      userData.start_date,
      userData.end_date,
      userData.status,
      userData.is_free_trial_used
    ]);

    return userResults; // Returns the inserted user data
  }

  // Find user by email
  static async findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [results] = await db.execute(query, [email]);
    return results.length > 0 ? results[0] : null;
  }

  // Get user by email
  static async getByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [results] = await db.execute(query, [email]);
    return results.length > 0 ? results[0] : null;
  }

  // Get user by ID and associated subscription data
  static async getById(id) {
    const query = `
      SELECT users.*, subscriptions.*
      FROM users 
      LEFT JOIN subscriptions ON users.id = subscriptions.user_id
      WHERE users.id = ?`;
    const [results] = await db.execute(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  // Update user details
  static async update(id, userData) {
    const query = 'UPDATE users SET username = ?, email = ?, password = ?, phone = ?, role = ? WHERE id = ?';
    const [userResults] = await db.execute(query, [
      userData.username,
      userData.email,
      userData.password,
      userData.phone,
      userData.role,
      id,
    ]);

    // Update subscription data if provided
    if (userData.subscription_plan || userData.start_date || userData.end_date || userData.status) {
      const subscriptionQuery = 'UPDATE subscriptions SET subscription_plan = ?, start_date = ?, end_date = ?, status = ? WHERE user_id = ?';
      await db.execute(subscriptionQuery, [
        userData.subscription_plan,
        userData.start_date,
        userData.end_date,
        userData.status,
        id,
      ]);
    }

    return userResults.affectedRows > 0;
  }

  // Delete user along with their subscription data
  static async delete(id) {
    const deleteSubscriptionQuery = 'DELETE FROM subscriptions WHERE user_id = ?';
    const [subscriptionResults] = await db.execute(deleteSubscriptionQuery, [id]);

    const query = 'DELETE FROM users WHERE id = ?';
    const [userResults] = await db.execute(query, [id]);

    return userResults.affectedRows > 0 && subscriptionResults.affectedRows > 0;
  }

  // Insert activation code for new user
  static async insertActivationCode(userId, activationCode, expiryDate) {
    const query = 'INSERT INTO activation_codes (user_id, code, expiry_date) VALUES (?, ?, ?)';
    await db.execute(query, [userId, activationCode, expiryDate]);
  }

  // Insert password reset token
  static async insertPasswordReset(userId, hashedToken, expiryDate) {
    const query = 'INSERT INTO password_resets (user_id, token, expiry_date) VALUES (?, ?, ?)';
    await db.execute(query, [userId, hashedToken, expiryDate]);
  }

  // Insert subscription data for a user
  static async insertSubscription(userId, subscriptionPlan, startDate, endDate, status, isFreeTrialUsed) {
    const query = 'INSERT INTO subscriptions (user_id, subscription_plan, start_date, end_date, status, is_free_trial_used) VALUES (?, ?, ?, ?, ?, ?)';
    await db.execute(query, [userId, subscriptionPlan, startDate, endDate, status, isFreeTrialUsed]);
  }
}

module.exports = User;
