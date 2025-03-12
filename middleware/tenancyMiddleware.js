const { getTenantDatabase } = require("../config/db");
const { publicRoutes } = require("../config/constants");

/**
 * Tenancy Middleware
 * - Skips tenancy check for public routes
 * - Ensures user authentication before checking tenant
 * - Initializes tenant-specific database connection
 */
module.exports = async (req, res, next) => {
  try {
    // ✅ Skip tenancy check for public routes
    if (publicRoutes.includes(req.path)) {
      console.log(`🟢 Public route accessed: ${req.path}, skipping tenant check.`);
      return next();
    }

    // 🔒 Ensure authentication for protected routes
    if (!req.user || !req.user.id || !req.user.tenantId) {
      console.warn(`🔴 [WARNING] Unauthorized access attempt to ${req.path}.`);
      return res.status(401).json({ message: "Unauthorized. Authentication required." });
    }

    const tenantId = req.user.tenantId;
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
