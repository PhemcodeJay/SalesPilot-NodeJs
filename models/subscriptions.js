const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/db"); // Import Sequelize instance

// **Define Subscription Model**
class Subscription extends Model {
  // **Create a new subscription**
  static async createSubscription(subscriptionData) {
    try {
      return await Subscription.create(subscriptionData);
    } catch (error) {
      console.error("❌ Error creating subscription:", error);
      throw error;
    }
  }

  // **Fetch all subscriptions**
  static async getAllSubscriptions() {
    try {
      return await Subscription.findAll({ order: [["createdAt", "DESC"]] });
    } catch (error) {
      console.error("❌ Error fetching subscriptions:", error);
      throw error;
    }
  }

  // **Fetch a single subscription by ID**
  static async getSubscriptionById(id) {
    try {
      return await Subscription.findByPk(id);
    } catch (error) {
      console.error("❌ Error fetching subscription by ID:", error);
      throw error;
    }
  }

  // **Update a subscription**
  static async updateSubscription(id, updatedData) {
    try {
      const [updatedRows] = await Subscription.update(updatedData, { where: { id } });
      return updatedRows > 0; // Returns true if at least one row was updated
    } catch (error) {
      console.error("❌ Error updating subscription:", error);
      throw error;
    }
  }

  // **Delete a subscription**
  static async deleteSubscription(id) {
    try {
      return await Subscription.destroy({ where: { id } });
    } catch (error) {
      console.error("❌ Error deleting subscription:", error);
      throw error;
    }
  }
}

// **Initialize Subscription Model with Sequelize**
Subscription.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    subscription_plan: {
      type: DataTypes.ENUM("trial", "starter", "business", "enterprise"),
      allowNull: false,
      defaultValue: "trial",
    },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "Active" },
    is_free_trial_used: { type: DataTypes.BOOLEAN, defaultValue: false },
    tenant_id: { type: DataTypes.CHAR(36), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: "Subscription",
    tableName: "subscriptions",
    timestamps: false, // Sequelize won't auto-create timestamps since we handle them manually
  }
);

// **CRUD Operations**

(async function manageSubscriptions() {
  try {
    // **Create a new subscription**
    const newSubscription = await Subscription.createSubscription({
      user_id: 1,
      subscription_plan: "starter",
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "Active",
      is_free_trial_used: false,
      tenant_id: "123e4567-e89b-12d3-a456-426614174000", // Example tenant ID
    });
    console.log("✅ New subscription created:", newSubscription.toJSON());

    // **Fetch all subscriptions**
    const subscriptions = await Subscription.getAllSubscriptions();
    console.log("✅ All subscriptions:", subscriptions.map((sub) => sub.toJSON()));

    // **Update a subscription**
    const updatedSubscription = await Subscription.updateSubscription(newSubscription.id, { status: "Cancelled" });
    console.log("✅ Subscription updated:", updatedSubscription);

    // **Delete a subscription**
    const deletedSubscription = await Subscription.deleteSubscription(newSubscription.id);
    console.log("✅ Subscription deleted:", deletedSubscription);
  } catch (error) {
    console.error("❌ Error in subscription management:", error);
  }
})();
