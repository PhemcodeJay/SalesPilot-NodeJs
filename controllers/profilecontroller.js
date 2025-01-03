const bcrypt = require('bcryptjs'); // For password hashing
const userModel = require('../models/authModel');
const Subscription = require('../models/subscriptions'); // Import the subscriptions model
const dayjs = require('dayjs'); // For date manipulation
const db = require('../config/db'); // Assuming the db connection is configured here

// Helper function to check if a user has an active subscription
const checkSubscription = async (userId) => {
  try {
    // Fetch subscription status using the subscriptions model
    const activeSubscription = await Subscription.getActiveSubscription(userId);
    return activeSubscription ? true : false; // Return true if subscription is active, false otherwise
  } catch (error) {
    throw new Error(`Error checking subscription: ${error.message}`);
  }
};

// Profile controller actions
exports.getUserProfile = async (req, res) => {
  const userId = req.params.userId; // Get user ID from URL params

  try {
    // Fetch user data from the 'users' table using User model
    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user has an active subscription
    const isSubscribed = await checkSubscription(userId);

    res.render('profile', {
      email: user.email,
      name: user.username,
      date_joined: dayjs(user.date_joined).format('MMMM D, YYYY'),
      isSubscribed: isSubscribed
    });
  } catch (error) {
    res.status(500).send(`Error fetching user profile: ${error.message}`);
  }
};

exports.updateUserProfile = async (req, res) => {
  const userId = req.params.userId; // Get user ID from URL params
  const { username, email, password, phone, role } = req.body; // Get updated data from request body

  try {
    // Check if the password is being updated
    let updatedData = { username, email, phone, role };
    if (password) {
      // Hash the new password before saving it
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedData.password = hashedPassword;
    }

    // Update user profile using the User model
    const updated = await User.update(userId, updatedData);

    if (updated) {
      res.send('Profile updated successfully');
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send(`Error updating user profile: ${error.message}`);
  }
};

exports.deleteUserProfile = async (req, res) => {
  const userId = req.params.userId; // Get user ID from URL params

  try {
    // Delete user profile using the User model
    const deleted = await User.delete(userId);

    if (deleted) {
      res.send('Profile deleted successfully');
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send(`Error deleting user profile: ${error.message}`);
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Fetch the user's active subscription using the Subscription model
    const subscription = await Subscription.getActiveSubscription(userId);

    if (!subscription) {
      return res.status(404).send('No active subscription found');
    }

    // Check if the subscription is active and within the valid period
    const isActive = dayjs().isBetween(subscription.start_date, subscription.end_date, null, '[]');

    res.json({
      subscriptionStatus: isActive ? 'Active' : 'Inactive',
      subscriptionType: subscription.type,
      startDate: dayjs(subscription.start_date).format('MMMM D, YYYY'),
      endDate: dayjs(subscription.end_date).format('MMMM D, YYYY')
    });
  } catch (error) {
    res.status(500).send(`Error fetching subscription status: ${error.message}`);
  }
};

// Handle payment processing (basic structure)
exports.processPayment = async (req, res) => {
  const { userId, amount, paymentMethod } = req.body; // Get payment data from request body

  try {
    // Simulate the payment processing (real gateway integration would be here)
    const paymentDate = dayjs().format('YYYY-MM-DD');

    // Insert payment into the 'payments' table
    const query = `
      INSERT INTO payments (user_id, amount, payment_date, status)
      VALUES (?, ?, ?, ?)
    `;
    const [paymentResult] = await db.query(query, [userId, amount, paymentDate, 'completed']);

    if (paymentResult.insertId) {
      // After successful payment, update the subscription
      const subscriptionEndDate = dayjs().add(1, 'year').format('YYYY-MM-DD'); // Example: yearly subscription

      const subscriptionData = {
        user_id: userId,
        status: 'active',
        end_date: subscriptionEndDate
      };

      // Update the subscription using the Subscription model
      await Subscription.updateSubscription(userId, subscriptionData);

      res.send('Payment processed and subscription activated');
    } else {
      res.status(500).send('Payment processing failed');
    }
  } catch (error) {
    res.status(500).send(`Error processing payment: ${error.message}`);
  }
};

// Update password function
exports.updatePassword = async (req, res) => {
  const userId = req.params.userId; // Get user ID from URL params
  const { oldPassword, newPassword } = req.body; // Get old and new passwords from request body

  try {
    // Fetch the user from the database
    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Compare old password with the stored password (hashed)
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).send('Old password is incorrect');
    }

    // Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    const updated = await User.update(userId, { password: hashedPassword });

    if (updated) {
      res.send('Password updated successfully');
    } else {
      res.status(500).send('Error updating password');
    }
  } catch (error) {
    res.status(500).send(`Error updating password: ${error.message}`);
  }
};