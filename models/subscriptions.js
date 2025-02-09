const { Model, DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

class Subscription extends Model {
  /**
   * Create a Free Trial Subscription
   * @param {UUID} userId - The ID of the user
   * @param {UUID} tenantId - The ID of the tenant
   * @returns {Object} The created subscription
   * @throws {Error} If the creation fails
   */
  static async createFreeTrial(userId, tenantId) {
    try {
      if (!userId || !tenantId) {
        throw new Error('User ID and Tenant ID are required to create a Trial subscription.');
      }

      const existingTrial = await Subscription.findOne({
        where: { user_id: userId, tenant_id: tenantId, subscription_plan: 'Trial' },
      });

      if (existingTrial) {
        throw new Error('User has already used a free trial.');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + 3); // 3-month free trial

      return await Subscription.create({
        user_id: userId,
        tenant_id: tenantId,
        subscription_plan: 'Trial',
        start_date: startDate,
        end_date: endDate,
        status: 'Active',
        is_free_trial_used: true,
      });
    } catch (error) {
      console.error(`Error creating Trial subscription for user ${userId} (Tenant ${tenantId}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the active subscription of a user within a tenant
   * @param {UUID} userId - The ID of the user
   * @param {UUID} tenantId - The ID of the tenant
   * @returns {Object|null} The active subscription or null
   */
  static async getActiveSubscription(userId, tenantId) {
    try {
      return await Subscription.findOne({
        where: {
          user_id: userId,
          tenant_id: tenantId,
          status: 'Active',
        },
      });
    } catch (error) {
      console.error(`Error fetching active subscription for user ${userId} (Tenant ${tenantId}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Update subscription details
   * @param {UUID} userId - The ID of the user
   * @param {UUID} tenantId - The ID of the tenant
   * @param {Object} data - Fields to update (e.g., status, end_date)
   * @returns {Object|null} The updated subscription object or null if not found
   */
  static async updateSubscription(userId, tenantId, data) {
    try {
      const subscription = await Subscription.findOne({
        where: { user_id: userId, tenant_id: tenantId },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      await subscription.update(data);
      return subscription; // ✅ Return updated object instead of boolean
    } catch (error) {
      console.error(`Error updating subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upgrade a subscription plan
   * @param {UUID} userId - The ID of the user
   * @param {UUID} tenantId - The ID of the tenant
   * @param {String} newPlan - The new subscription plan
   * @returns {Boolean} True if upgrade was successful
   */
  static async upgradeSubscription(userId, tenantId, newPlan) {
    try {
      const [updated] = await Subscription.update(
        { subscription_plan: newPlan, status: 'Active', is_free_trial_used: false },
        { where: { user_id: userId, tenant_id: tenantId, status: 'Active' } }
      );

      return updated > 0;
    } catch (error) {
      console.error(`Error upgrading subscription for user ${userId} (Tenant ${tenantId}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel an active subscription
   * @param {UUID} userId - The ID of the user
   * @param {UUID} tenantId - The ID of the tenant
   * @returns {Boolean} True if cancellation was successful
   */
  static async cancelSubscription(userId, tenantId) {
    try {
      const [updated] = await Subscription.update(
        { status: 'Cancelled' },
        { where: { user_id: userId, tenant_id: tenantId, status: 'Active' } }
      );

      return updated > 0;
    } catch (error) {
      console.error(`Error cancelling subscription for user ${userId} (Tenant ${tenantId}): ${error.message}`);
      throw error;
    }
  }
}

// Initialize Sequelize Model
Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'tenants', key: 'id' },
      onDelete: 'CASCADE',
    },
    subscription_plan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Active',
    },
    is_free_trial_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
  }
);

module.exports = Subscription;
