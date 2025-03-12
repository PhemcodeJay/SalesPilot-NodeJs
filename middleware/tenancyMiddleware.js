const { getTenantDatabase } = require("../config/db");
const { publicRoutes } = require("../config/constants");

/**
 * Tenancy Middleware
 * - Skips tenancy check for public routes
 * - Initializes tenant-specific database connection without enforcing authentication
 */
module.exports = async (req, res, next) => {
  try {
    // ✅ Skip tenancy check for public routes
    if (publicRoutes.includes(req.path)) {
      console.log(`🟢 Public route accessed: ${req.path}, skipping tenant check.`);
      return next();
    }

    // 🔹 Check if user is authenticated but **DO NOT** enforce authentication
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      console.warn(`⚠️ [WARNING] No tenant ID found for request to ${req.path}. Proceeding without tenant DB.`);
      return next(); // Allow request to proceed even if no tenant ID is found
    }

    console.log(`🔄 [INFO] Initializing tenant database for Tenant ID: ${tenantId}`);

    // 🔹 Fetch the tenant-specific database instance
    const sequelize = getTenantDatabase(tenantId);

    // ❌ Handle database initialization failure
    if (!sequelize) {
      console.error(`❌ [ERROR] Failed to initialize tenant database for Tenant ID: ${tenantId}`);
      return res.status(500).json({ message: "Error initializing tenant database." });
    }

    // ✅ Attach tenant database instance & tenant ID to request
    req.sequelize = sequelize;
    req.tenantId = tenantId;
    console.log(`✅ [SUCCESS] Tenant database initialized for: ${tenantId}`);

    next();
  } catch (error) {
    console.error(`❌ [ERROR] Unexpected error in tenancy middleware: ${error.message}`);
    return res.status(500).json({ message: "Internal server error." });
  }
};
