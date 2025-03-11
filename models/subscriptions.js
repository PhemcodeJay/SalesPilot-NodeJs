const { Model, DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

class Subscription extends Model {
  /**
   * Define model associations
   */
  static associate(models) {
    Subscription.belongsTo(models.User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
    Subscription.belongsTo(models.Tenant, { foreignKey: 'tenant_id', as: 'tenant', onDelete: 'CASCADE' });
  }

  /**
   * Create a Free trial Subscription
   */
  static async createFreetrial(userId, tenantId) {
    try {
      if (!userId || !tenantId) {
        throw new Error('User ID and Tenant ID are required.');
      }

      const activeSubscription = await Subscription.findOne({
        where: { user_id: userId, tenant_id: tenantId, status: 'Active' },
      });

      if (activeSubscription) {
        throw new Error('User already has an active subscription.');
      }

      const existingtrial = await Subscription.findOne({
        where: { user_id: userId, tenant_id: tenantId, subscription_plan: 'trial' },
      });

      if (existingtrial) {
        throw new Error('User has already used a free trial.');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + 3); // 3-month free trial

      return await Subscription.create({
        user_id: userId,
        tenant_id: tenantId,
        subscription_plan: 'trial',  // Default subscription plan is 'trial'
        start_date: startDate,
        end_date: endDate,
        status: 'Active',
        is_free_trial_used: true,
      });
    } catch (error) {
      console.error(`Error creating trial subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the active subscription of a user within a tenant
   */
  static async getActiveSubscription(userId, tenantId) {
    try {
      return await Subscription.findOne({
        where: { user_id: userId, tenant_id: tenantId, status: 'Active' },
      });
    } catch (error) {
      console.error(`Error fetching active subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update subscription details
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
      return subscription;
    } catch (error) {
      console.error(`Error updating subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upgrade a subscription plan
   */
  static async upgradeSubscription(userId, tenantId, newPlan, durationMonths) {
    try {
      const subscription = await Subscription.findOne({
        where: { user_id: userId, tenant_id: tenantId, status: 'Active' },
      });

      if (!subscription) {
        throw new Error('No active subscription to upgrade.');
      }

      const newEndDate = new Date(subscription.end_date);
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

      await subscription.update({
        subscription_plan: newPlan,
        end_date: newEndDate,
        is_free_trial_used: false,
      });

      return subscription;
    } catch (error) {
      console.error(`Error upgrading subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Renew an expired subscription
   */
  static async renewSubscription(userId, tenantId, durationMonths) {
    try {
      const subscription = await Subscription.findOne({
        where: {
          user_id: userId,
          tenant_id: tenantId,
          status: { [Op.or]: ['Expired', 'Cancelled'] },
        },
      });

      if (!subscription) {
        throw new Error('No expired or cancelled subscription found.');
      }

      const newStartDate = new Date();
      const newEndDate = new Date();
      newEndDate.setMonth(newStartDate.getMonth() + durationMonths);

      await subscription.update({
        start_date: newStartDate,
        end_date: newEndDate,
        status: 'Active',
      });

      return subscription;
    } catch (error) {
      console.error(`Error renewing subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel an active subscription
   */
  static async cancelSubscription(userId, tenantId) {
    try {
      const subscription = await Subscription.findOne({
        where: { user_id: userId, tenant_id: tenantId, status: 'Active' },
      });

      if (!subscription) {
        throw new Error('No active subscription to cancel.');
      }

      await subscription.update({ status: 'Cancelled', end_date: new Date() });

      return true;
    } catch (error) {
      console.error(`Error cancelling subscription: ${error.message}`);
      throw error;
    }
  }
}

// ✅ Initialize Subscription Model
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
      type: DataTypes.ENUM('trial', 'starter', 'business', 'enterprise'),
      allowNull: false,
      defaultValue: 'trial',  // Default value for subscription_plan is 'trial'
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
      type: DataTypes.ENUM('Active', 'Cancelled', 'Expired'),
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

// ✅ Export the Subscription model

module.exports = Subscription;
