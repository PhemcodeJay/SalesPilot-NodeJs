const { DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("models");
const { sequelize, getTenantDatabase } = require("../config/db.js");

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
      }
    } catch (error) {
      console.error(`❌ Error loading model ${file}:`, error.message);
    }
  });

// ✅ Establish associations if defined
Object.values(models).forEach((model) => {
  if (model.associate && typeof model.associate === "function") {
    model.associate(models);
  }
});

// ✅ Initialize models for a tenant database
/**
 * @param {string} tenantDbName - The tenant's database name.
 * @returns {Promise<{sequelize: Sequelize, models: object}>}
 */
async function initializeTenantModels(tenantDbName) {
  try {
    if (!tenantDbName) throw new Error("❌ Tenant database name is required.");
    
    const tenantSequelize = await getTenantDatabase(tenantDbName);
    const tenantModels = {};

    Object.keys(models).forEach((modelName) => {
      if (typeof models[modelName] === "function") {
        tenantModels[modelName] = models[modelName](tenantSequelize, DataTypes);
      }
    });

    Object.values(tenantModels).forEach((model) => {
      if (model.associate && typeof model.associate === "function") {
        model.associate(tenantModels);
      }
    });

    debug(`✅ Models initialized for tenant: ${tenantDbName}`);
    return { sequelize: tenantSequelize, models: tenantModels };
  } catch (error) {
    console.error(`❌ Tenant Model Initialization Error:`, error.message);
    throw error;
  }
}

// ✅ Export models and Sequelize instance
module.exports = { sequelize, models, initializeTenantModels };
