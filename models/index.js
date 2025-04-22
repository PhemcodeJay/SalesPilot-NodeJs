const { DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("models");
const { sequelize, getTenantDatabase } = require("../config/db");

if (!sequelize) {
  throw new Error("❌ Sequelize instance not initialized in db.js");
}

const models = {};
const modelsDirectory = __dirname;
const baseFilename = path.basename(__filename);

// ✅ Load all model files (except this one)
fs.readdirSync(modelsDirectory)
  .filter((file) => file.endsWith(".js") && file !== baseFilename)
  .forEach((file) => {
    try {
      const modelFn = require(path.join(modelsDirectory, file));
      if (typeof modelFn === "function") {
        const model = modelFn(sequelize, DataTypes);
        models[model.name] = model;

        // Directly export each model
        module.exports[model.name] = model;

        debug(`✅ Model ${model.name} loaded.`);
      }
    } catch (err) {
      console.error(`❌ Error loading model ${file}:`, err.message);
    }
  });

// ✅ Establish global associations for main models
Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(models);
    debug(`🔗 Associations established for model: ${model.name}`);
  }
});

// ✅ Initialize models and associations for a specific tenant DB
async function initializeTenantModels(tenantDbName) {
  try {
    if (!tenantDbName) throw new Error("❌ Tenant DB name is required.");

    const tenantSequelize = await getTenantDatabase(tenantDbName);
    const tenantModels = {};

    // Load tenant models using tenant DB instance
    const tenantModelFiles = fs.readdirSync(modelsDirectory)
      .filter((file) => file.endsWith(".js") && file !== baseFilename);

    for (const file of tenantModelFiles) {
      try {
        const modelFn = require(path.join(modelsDirectory, file));
        if (typeof modelFn === "function") {
          const model = modelFn(tenantSequelize, DataTypes);
          tenantModels[model.name] = model;
          debug(`✅ Tenant model ${model.name} initialized.`);
        }
      } catch (err) {
        console.error(`❌ Error initializing tenant model ${file}:`, err.message);
      }
    }

    // Apply associations for tenant models
    Object.values(tenantModels).forEach((model) => {
      if (typeof model.associate === "function") {
        model.associate(tenantModels);
        debug(`🔗 Associations set for tenant model: ${model.name}`);
      }
    });

    debug(`🚀 Tenant models initialized for DB: ${tenantDbName}`);
    return { sequelize: tenantSequelize, models: tenantModels };
  } catch (err) {
    console.error(`❌ Failed to initialize tenant models for ${tenantDbName}:`, err.message);
    throw err;
  }
}

// Export core
module.exports.sequelize = sequelize;
module.exports.models = models;
module.exports.initializeTenantModels = initializeTenantModels;
