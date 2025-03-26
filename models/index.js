const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { sequelize, getTenantDatabase } = require("../config/db.js"); // Ensure db.js exports a sequelize instance

// Load environment variables
dotenv.config();

const models = {};

// ✅ Dynamically load all model files in the root "models" folder
fs.readdirSync(__dirname)
  .filter((file) => file.endsWith(".js") && file !== path.basename(__filename))
  .forEach((file) => {
    const modelPath = path.join(__dirname, file);
    const model = require(modelPath);

    if (model.init && typeof model.init === "function") {
      const initializedModel = model.init(sequelize, DataTypes);
      models[initializedModel.name] = initializedModel;
    }
  });

// ✅ Establish model associations if defined
Object.values(models).forEach((model) => {
  if (model.associate && typeof model.associate === "function") {
    model.associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = sequelize.Sequelize;

// ✅ Define model associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

/**
 * Initialize models for a tenant database.
 * @param {string} tenantDbName - The tenant's database name.
 * @returns {Promise<{sequelize: Sequelize, models: object}>}
 */
async function initializeTenantModels(tenantDbName) {
  const tenantSequelize = await getTenantDatabase(tenantDbName);
  const tenantModels = {};

  // Initialize models for the tenant
  Object.keys(models).forEach((modelName) => {
    if (models[modelName].init) {
      tenantModels[modelName] = models[modelName].init(tenantSequelize, DataTypes);
    }
  });

  // Associate tenant models
  Object.values(tenantModels).forEach((model) => {
    if (model.associate) {
      model.associate(tenantModels);
    }
  });

  console.log(`✅ Models initialized for tenant: ${tenantDbName}`);
  return { sequelize: tenantSequelize, models: tenantModels };
}

// ✅ Export Sequelize instance and models for the main database
module.exports = { sequelize, models, initializeTenantModels };
