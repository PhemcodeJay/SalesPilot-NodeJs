const { Op } = require('sequelize');
const { models } = require('../config/db');
const { logError, logSecurityEvent } = require('../utils/logger');
const ActivationCodeService = require('./ActivationCodeService');

const PLANS = {
  trial: {
    durationMonths: 3,
    features: ['basic_reports'],
    price: 0,
    requiresActivation: true
  },
  starter: {
    durationMonths: 12,
    features: ['basic_reports', 'inventory_tracking'],
    price: 100,
    requiresActivation: false
  },
  business: {
    durationMonths: 12,
    features: ['basic_reports', 'inventory_tracking', 'sales_forecasting'],
    price: 250,
    requiresActivation: false
  },
  enterprise: {
    durationMonths: 12,
    features: ['basic_reports', 'inventory_tracking', 'sales_forecasting', 'multi_user_access'],
    price: 500,
    requiresActivation: false
  },
};

class SubscriptionService {
  constructor(tenantId) {
    if (!tenantId) throw new Error('Tenant ID is required');
    this.tenantId = tenantId;
    this.activationService = new ActivationCodeService(tenantId);
  }

  /**
   * Create a new subscription for a tenant
   * @param {string} plan - Subscription plan type
   * @param {object} options - Configuration options
   * @param {object} [options.transaction] - Optional transaction
   * @param {string} [options.ipAddress] - IP address for security logging
   * @returns {Promise<object>} Created subscription
   */
  async create(plan = 'trial', { transaction = null, ipAddress = null } = {}) {
    const t = transaction || null;
    
    try {
      // Validate plan
      const planDetails = PLANS[plan];
      if (!planDetails) throw new Error(`Invalid subscription plan: ${plan}`);

      // Fetch Tenant
      const tenant = await models.Tenant.findByPk(this.tenantId, { transaction: t });
      if (!tenant) throw new Error(`Tenant not found for tenantId: ${this.tenantId}`);

      // Check for trial plan restrictions
      if (plan === 'trial') {
        const trialUsed = await this._hasUsedTrial(t);
        if (trialUsed) throw new Error('Free trial has already been used');
      }

      // Check for existing active subscription
      if (await this._hasActiveSubscription(t)) {
        throw new Error('Tenant already has an active or pending subscription');
      }

      // Calculate subscription dates
      const { startDate, endDate } = this._calculateSubscriptionDates(planDetails.durationMonths);

      // Create subscription record
      const subscription = await models.Subscription.create(
        {
          tenant_id: this.tenantId,
          subscription_plan: plan,
          start_date: startDate,
          end_date: endDate,
          status: 'Active',
          is_free_trial_used: plan === 'trial',
          features: JSON.stringify(planDetails.features),
          price: planDetails.price,
        },
        { transaction: t }
      );

      // Update tenant subscription dates
      await this._updateTenantDates(startDate, endDate, t);

      // Handle activation for plans that require it
      if (planDetails.requiresActivation) {
        await this._handlePlanActivation(t, ipAddress);
      }

      logSecurityEvent('subscription_created', {
        tenantId: this.tenantId,
        plan,
        subscriptionId: subscription.id,
        ipAddress
      });

      return subscription;

    } catch (error) {
      logError(`Subscription creation failed for tenant ${this.tenantId}`, error, {
        tenantId: this.tenantId,
        operation: 'create',
        plan
      });
      throw error;
    }
  }

  /**
   * Renew expired subscriptions
   * @param {object} options - Configuration options
   * @param {object} [options.transaction] - Optional transaction
   * @returns {Promise<{renewedCount: number}>} Renewal results
   */
  static async renewExpired({ transaction = null } = {}) {
    const t = transaction || null;
    
    try {
      const expiredSubs = await models.Subscription.findAll({
        where: { status: 'Expired' },
        transaction: t,
      });

      let renewedCount = 0;

      for (const sub of expiredSubs) {
        const service = new SubscriptionService(sub.tenant_id);
        renewedCount += await service._renewSingleSubscription(sub, t);
      }

      logSecurityEvent('subscriptions_renewed', {
        count: renewedCount
      });

      return { renewedCount };

    } catch (error) {
      logError('Failed to renew subscriptions', error, {
        operation: 'renewExpired'
      });
      throw error;
    }
  }

  /**
   * Get active subscription for tenant
   * @param {object} options - Configuration options
   * @param {object} [options.transaction] - Optional transaction
   * @returns {Promise<object>} Active subscription
   */
  async getActive({ transaction = null } = {}) {
    const t = transaction || null;
    
    try {
      const subscription = await models.Subscription.findOne({
        where: {
          tenant_id: this.tenantId,
          status: 'Active',
        },
        order: [['created_at', 'DESC']],
        transaction: t,
      });

      if (!subscription) {
        throw new Error(`No active subscription found for tenant ${this.tenantId}`);
      }

      return subscription;

    } catch (error) {
      logError(`Failed to get active subscription for tenant ${this.tenantId}`, error, {
        tenantId: this.tenantId,
        operation: 'getActive'
      });
      throw error;
    }
  }

  /**
   * Get current plan details for tenant
   * @param {object} options - Configuration options
   * @param {object} [options.transaction] - Optional transaction
   * @returns {Promise<object>} Plan details
   */
  async getPlanDetails({ transaction = null } = {}) {
    const t = transaction || null;
    
    try {
      const subscription = await this.getActive({ transaction: t });
      const planDetails = PLANS[subscription.subscription_plan];

      if (!planDetails) {
        throw new Error(`Invalid plan type: ${subscription.subscription_plan}`);
      }

      return planDetails;

    } catch (error) {
      logError(`Failed to get plan details for tenant ${this.tenantId}`, error, {
        tenantId: this.tenantId,
        operation: 'getPlanDetails'
      });
      throw error;
    }
  }

  /**
   * Get all available plans
   * @returns {object} All available plans
   */
  static getAllPlans() {
    return PLANS;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Check if tenant has used trial
   * @private
   */
  async _hasUsedTrial(transaction) {
    return await models.Subscription.findOne({
      where: {
        tenant_id: this.tenantId,
        is_free_trial_used: true,
        status: { [Op.in]: ['Active', 'Pending', 'Expired'] },
      },
      transaction,
    });
  }

  /**
   * Check if tenant has active subscription
   * @private
   */
  async _hasActiveSubscription(transaction) {
    const existing = await models.Subscription.findOne({
      where: {
        tenant_id: this.tenantId,
        status: { [Op.in]: ['Active', 'Pending'] },
      },
      order: [['created_at', 'DESC']],
      transaction,
    });

    return existing && new Date(existing.end_date) > new Date();
  }

  /**
   * Calculate subscription dates
   * @private
   */
  _calculateSubscriptionDates(durationMonths) {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + durationMonths);
    return { startDate, endDate };
  }

  /**
   * Update tenant subscription dates
   * @private
   */
  async _updateTenantDates(startDate, endDate, transaction) {
    const tenant = await models.Tenant.findByPk(this.tenantId, { transaction });
    if (tenant) {
      tenant.subscription_start_date = startDate;
      tenant.subscription_end_date = endDate;
      await tenant.save({ transaction });
    }
  }

  /**
   * Handle plan activation requirements
   * @private
   */
  async _handlePlanActivation(transaction, ipAddress) {
    try {
      // Get primary user for tenant
      const user = await models.User.findOne({ 
        where: { tenant_id: this.tenantId },
        transaction,
        order: [['created_at', 'ASC']] // Get oldest user (likely owner)
      });

      if (user) {
        // Generate and send activation code
        await this.activationService.generate({ 
          transaction, 
          ipAddress 
        });
      }
    } catch (error) {
      logError(`Plan activation handling failed for tenant ${this.tenantId}`, error, {
        tenantId: this.tenantId,
        operation: '_handlePlanActivation'
      });
      // Don't throw - subscription is still valid
    }
  }

  /**
   * Renew single subscription
   * @private
   */
  async _renewSingleSubscription(subscription, transaction) {
    const planDetails = PLANS[subscription.subscription_plan];
    if (!planDetails) return 0;

    const { startDate, endDate } = this._calculateSubscriptionDates(planDetails.durationMonths);

    // Update subscription
    subscription.start_date = startDate;
    subscription.end_date = endDate;
    subscription.status = 'Active';
    await subscription.save({ transaction });

    // Update tenant
    await this._updateTenantDates(startDate, endDate, transaction);

    return 1;
  }
}

module.exports = SubscriptionService;