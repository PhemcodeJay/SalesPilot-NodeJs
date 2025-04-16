require('dotenv').config(); // Always load env vars first

const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("models");

// 🌐 Main Admin DB Setup
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("❌ DATABASE_URL is not set in .env");

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  logging: debug,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 📦 Load Admin Models
const models = {};
const modelsDirectory = __dirname;
const baseFilename = path.basename(__filename);

fs.readdirSync(modelsDirectory)
  .filter(file => file.endsWith(".js") && file !== baseFilename)
  .forEach(file => {
    try {
      const modelFn = require(path.join(modelsDirectory, file));
      if (typeof modelFn === "function") {
        const model = modelFn(sequelize, DataTypes);
        models[model.name] = model;
        debug(`✅ Admin Model loaded: ${model.name}`);
      }
    } catch (err) {
      console.error(`❌ Error loading model ${file}:`, err.message);
    }
  });

// 🔗 Setup associations
Object.values(models).forEach(model => {
  if (typeof model.associate === "function") {
    model.associate(models);
    debug(`🔗 Association set for: ${model.name}`);
  }
});

// ✅ Admin DB Utilities
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    debug("✅ Connected to admin database.");
  } catch (err) {
    console.error("❌ Admin DB connection failed:", err.message);
    throw err;
  }
};

const syncModels = async () => {
  try {
    await sequelize.sync({ force: false });
    debug("✅ Admin DB models synced.");
  } catch (err) {
    console.error("❌ Error syncing admin DB models:", err.message);
    throw err;
  }
};

const closeAllConnections = async () => {
  try {
    await sequelize.close();
    debug("🛑 Admin DB connection closed.");
  } catch (err) {
    console.error("❌ Error closing admin DB connection:", err.message);
    throw err;
  }
};

// 🧩 Dynamic Tenant DB Support
const tenantDbCache = {};

/**
 * Dynamically create and return Sequelize + loaded models for a tenant DB
 */
const getTenantDb = (dbName) => {
  if (!dbName) throw new Error("❌ Tenant DB name is required");

  if (tenantDbCache[dbName]) return tenantDbCache[dbName];

  const tenantSequelize = new Sequelize(dbName, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: debug
  });

  const tenantModels = {};
  fs.readdirSync(modelsDirectory)
    .filter(file => file.endsWith(".js") && file !== baseFilename)
    .forEach(file => {
      const modelFn = require(path.join(modelsDirectory, file));
      if (typeof modelFn === "function") {
        const model = modelFn(tenantSequelize, DataTypes);
        tenantModels[model.name] = model;
      }
    });

  Object.values(tenantModels).forEach(model => {
    if (typeof model.associate === "function") {
      model.associate(tenantModels);
    }
  });

  tenantDbCache[dbName] = {
    sequelize: tenantSequelize,
    models: tenantModels
  };

  return tenantDbCache[dbName];
};

module.exports = {
  sequelize,
  models,
  testConnection,
  syncModels,
  closeAllConnections,
  getTenantDb // ✅ Exported for dynamic tenant use
};
