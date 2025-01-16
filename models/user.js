const db = require('../config/db');
const bcryptUtils = require('../utils/bcryptUtils');

class UserModel {
  async create(user) {
    const { username, email, password } = user;
    const subscriptionStartDate = new Date().toISOString().split('T')[0];
    const subscriptionEndDate = '2030-12-31';

    try {
      const hashedPassword = await bcryptUtils.hashPassword(password);

      await db.transaction(async (trx) => {
        const [userId] = await trx('users')
          .insert({ username, email, password: hashedPassword })
          .returning('id');

        await trx('subscriptions').insert({
          user_id: userId,
          start_date: subscriptionStartDate,
          end_date: subscriptionEndDate,
          status: 'active',
        });
      });

      return { success: true, message: 'User created successfully' };
    } catch (error) {
      console.error('Error creating user:', error.message);
      return { success: false, message: 'Failed to create user' };
    }
  }

  async update(userId, updates) {
    try {
      await db('users').where({ id: userId }).update(updates);
      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      console.error('Error updating user:', error.message);
      return { success: false, message: 'Failed to update user' };
    }
  }

  async delete(userId) {
    try {
      await db('users').where({ id: userId }).del();
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error.message);
      return { success: false, message: 'Failed to delete user' };
    }
  }

  async findOne(field, value) {
    try {
      const user = await db('users').where({ [field]: value }).first();
      return user || null;
    } catch (error) {
      console.error('Error finding user:', error.message);
      throw new Error('Failed to find user');
    }
  }
}

module.exports = new UserModel();
