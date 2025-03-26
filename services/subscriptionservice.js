const { Subscription } = require('../models'); // Sequelize model
const { Op } = require('sequelize');

/**
 * Create a new subscription.
 * @param {number} userId - User ID.
 * @param {number} planId - Subscription Plan ID.
 * @param {object|null} paymentDetails - Payment details (optional).
 * @returns {Promise<object>} Subscription object.
 */
const createSubscription = async (userId, planId, paymentDetails = null) => {
    try {
        const subscription = await Subscription.create({
            user_id: userId,
            plan_id: planId,
            payment_details: paymentDetails,
            status: 'active',
            start_date: new Date(),
            end_date: null
        });
        return subscription;
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw new Error('Subscription creation failed');
    }
};

/**
 * Get active subscriptions for a user.
 * @param {number} userId - User ID.
 * @returns {Promise<object[]>} List of active subscriptions.
 */
const getActiveSubscriptions = async (userId) => {
    try {
        return await Subscription.findAll({
            where: { user_id: userId, status: 'active' },
            order: [['start_date', 'DESC']]
        });
    } catch (error) {
        console.error('Error fetching active subscriptions:', error);
        throw new Error('Unable to fetch active subscriptions');
    }
};

/**
 * Cancel a subscription by ID.
 * @param {number} subscriptionId - Subscription ID.
 * @returns {Promise<boolean>} True if cancelled, otherwise false.
 */
const cancelSubscription = async (subscriptionId) => {
    try {
        const subscription = await Subscription.findByPk(subscriptionId);
        if (!subscription) return false;

        await subscription.update({ status: 'cancelled', end_date: new Date() });
        return true;
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw new Error('Subscription cancellation failed');
    }
};

/**
 * Create a Free Trial Subscription.
 * @param {number} userId - User ID.
 * @returns {Promise<object>} Free trial subscription object.
 */
const createFreeTrial = async (userId) => {
    try {
        const existingTrial = await Subscription.findOne({
            where: { user_id: userId, is_free_trial: true }
        });

        if (existingTrial) throw new Error('Free trial already used.');

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + 3); // 3-month free trial

        return await Subscription.create({
            user_id: userId,
            plan_id: null, // No specific plan for free trial
            status: 'active',
            start_date: startDate,
            end_date: endDate,
            is_free_trial: true
        });
    } catch (error) {
        console.error(`Error creating free trial subscription: ${error.message}`);
        throw error;
    }
};

/**
 * Get active subscription for a user.
 * @param {number} userId - User ID.
 * @returns {Promise<object|null>} Subscription object or null.
 */
const getActiveSubscription = async (userId) => {
    try {
        return await Subscription.findOne({
            where: { user_id: userId, status: 'active' },
            order: [['start_date', 'DESC']]
        });
    } catch (error) {
        console.error(`Error fetching active subscription: ${error.message}`);
        throw error;
    }
};

/**
 * Update a subscription status and end date.
 * @param {number} userId - User ID.
 * @param {object} data - Update data {status, end_date}.
 * @returns {Promise<boolean>} True if updated, otherwise false.
 */
const updateSubscription = async (userId, data) => {
    try {
        const result = await Subscription.update(data, {
            where: { user_id: userId }
        });
        return result[0] > 0;
    } catch (error) {
        console.error(`Error updating subscription: ${error.message}`);
        throw error;
    }
};

/**
 * Upgrade a subscription plan for a user.
 * @param {number} userId - User ID.
 * @param {number} newPlanId - New Plan ID.
 * @returns {Promise<boolean>} True if upgraded, otherwise false.
 */
const upgradeSubscription = async (userId, newPlanId) => {
    try {
        const result = await Subscription.update(
            { plan_id: newPlanId, status: 'active', is_free_trial: false },
            { where: { user_id: userId, status: 'active' } }
        );
        return result[0] > 0;
    } catch (error) {
        console.error(`Error upgrading subscription: ${error.message}`);
        throw error;
    }
};

/**
 * Cancel an active subscription by User ID.
 * @param {number} userId - User ID.
 * @returns {Promise<boolean>} True if cancelled, otherwise false.
 */
const cancelSubscriptionByUserId = async (userId) => {
    try {
        const result = await Subscription.update(
            { status: 'cancelled', end_date: new Date() },
            { where: { user_id: userId, status: 'active' } }
        );
        return result[0] > 0;
    } catch (error) {
        console.error(`Error cancelling subscription for user: ${error.message}`);
        throw error;
    }
};

/**
 * Get the subscription status for a user.
 * @param {number} userId - User ID.
 * @returns {Promise<string|null>} Subscription status or null.
 */
const getSubscriptionStatus = async (userId) => {
    try {
        const subscription = await Subscription.findOne({
            where: { user_id: userId, status: 'active' }
        });
        return subscription ? subscription.status : null;
    } catch (error) {
        console.error(`Error fetching subscription status: ${error.message}`);
        throw error;
    }
};

module.exports = {
    createSubscription,
    getActiveSubscriptions,
    cancelSubscription,
    createFreeTrial,
    getActiveSubscription,
    updateSubscription,
    upgradeSubscription,
    cancelSubscriptionByUserId,
    getSubscriptionStatus,
};
