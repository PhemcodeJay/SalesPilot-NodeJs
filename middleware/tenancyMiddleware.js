const { getTenantDatabase } = require("../config/db");
const { publicRoutes } = require("../config/constants");

module.exports = async (req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    console.log(`[INFO] Public route accessed: ${req.path}, skipping tenant check.`);
    return next();
  }

  if (!req.user || !req.user.id || !req.user.tenantId) {
    console.error("[ERROR] User authentication missing before tenancy check.");
    return res.status(401).json({ message: "Unauthorized. Authentication required." });
  }

  const tenantId = req.user.tenantId;

  try {
    console.log(`[INFO] Initializing tenant database for Tenant ID: ${tenantId}`);
    const sequelize = getTenantDatabase(tenantId);

    if (!sequelize) {
      throw new Error(`Failed to initialize tenant database for Tenant ID: ${tenantId}`);
    }

    req.sequelize = sequelize;
    req.tenantId = tenantId;

    console.log(`[SUCCESS] Tenant database initialized for: ${tenantId}`);
    next();
  } catch (error) {
    console.error(`[ERROR] Error setting up tenant database: ${error.message}`);
    return res.status(500).json({ message: "Error initializing tenant database." });
  }
};
