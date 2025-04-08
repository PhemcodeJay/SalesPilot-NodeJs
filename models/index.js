const { DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("models");
const { sequelize, getTenantDatabase } = require("../config/db.js"); // Import from db.js

// ✅ Ensure Sequelize instance is available
if (!sequelize) {
  throw new Error("❌ Sequelize instance not initialized in db.js");
}

const models = {};

// ✅ Dynamically load all models from the current directory
fs.readdirSync(__dirname)
  .filter((file) => file.endsWith(".js") && file !== path.basename(__filename))
  .forEach((file) => {
    try {
      const model = require(path.join(__dirname, file));
      if (typeof model === "function") {
        const initializedModel = model(sequelize, DataTypes);
        models[initializedModel.name] = initializedModel;
        debug(`✅ Model ${initializedModel.name} loaded successfully.`);
      }
    } catch (error) {
      console.error(`❌ Error loading model ${file}:`, error.message);
    }
  });

// ✅ Establish associations if defined
Object.values(models).forEach((model) => {
  if (model.associate && typeof model.associate === "function") {
    model.associate(models);
    debug(`✅ Associations established for model: ${model.name}`);
  }
});

// ✅ Initialize models for a tenant database
/**
 * @param {string} tenantDbName - The tenant's database name.
 * @returns {Promise<{sequelize: Sequelize, models: object}>}
 */
async function initializeTenantModels(tenantDbName) {
  try {
    if (!tenantDbName) {
      throw new Error("❌ Tenant database name is required.");
    }

    const tenantSequelize = await getTenantDatabase(tenantDbName); // Use db.js for tenant DB connection
    const tenantModels = {};

    // Initialize all models for the tenant
    Object.keys(models).forEach((modelName) => {
      if (typeof models[modelName] === "function") {
        tenantModels[modelName] = models[modelName](tenantSequelize, DataTypes);
        debug(`✅ Model ${modelName} initialized for tenant.`);
      }
    });

    // Setup associations for the tenant models
    Object.values(tenantModels).forEach((model) => {
      if (model.associate && typeof model.associate === "function") {
        model.associate(tenantModels);
        debug(`✅ Associations established for tenant model: ${model.name}`);
      }
    });

    debug(`✅ Models initialized successfully for tenant: ${tenantDbName}`);
    return { sequelize: tenantSequelize, models: tenantModels };
  } catch (error) {
    console.error(`❌ Tenant Model Initialization Error:`, error.message);
    throw error;
  }
}

// ✅ Export models and Sequelize instance from db.js
module.exports = { sequelize, models, initializeTenantModels };
