const { Subscription } = require("../models");

const checkSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    const userId = req.user.id;
    let tenantId = req.user.tenant_id;

    // Ensure tenant_id is always set
    if (!tenantId) {
      console.warn("⚠️ No tenant ID found in user session. Defaulting to NULL.");
      tenantId = null; // Set to null but still allow access
    }

    // Skip subscription check if tenant_id is missing
    if (tenantId === null) {
      console.info("ℹ️ No tenant ID found. Skipping subscription check.");
      return next();
    }

    // Fetch active subscription for user
    const subscription = await Subscription.findOne({
      where: {
        user_id: userId,
        tenant_id: tenantId,
        status: "active",
      },
    });

    if (!subscription) {
      return res.status(403).json({ message: "Subscription is inactive or expired. Please renew." });
    }

    next(); // Allow access if subscription is active
  } catch (error) {
    console.error("❌ Subscription Check Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = checkSubscription;
