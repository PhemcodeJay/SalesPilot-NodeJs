const { getTenantDatabase } = require("../config/db");

module.exports = async (req, res, next) => {
  const publicRoutes = ["/login", "/signup", "/index"];

  // Skip tenant logic for public routes
  if (publicRoutes.includes(req.path)) {
    console.log(`[INFO] Public route accessed: ${req.path}, skipping tenant check.`);
    return next();
  }

  if (!req.user || !req.user.id || !req.user.tenantId) {
    console.error("[ERROR] User authentication is missing before reaching tenancy middleware.");
    return res.status(401).json({ message: "Unauthorized access. User authentication is required." });
  }

  const tenantId = req.user.tenantId;

  try {
    console.log(`[INFO] Fetching tenant database for Tenant ID: ${tenantId}`);

    const sequelize = getTenantDatabase(tenantId);
    if (!sequelize) {
      throw new Error(`Failed to initialize tenant database for ${tenantId}`);
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
