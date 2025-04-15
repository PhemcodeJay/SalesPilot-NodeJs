require('dotenv').config(); // ✅ Always load this at the very top

const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("models");

// 🌐 Main App Database (e.g. Admin DB)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("❌ DATABASE_URL is not set in environment.");

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

// 🔄 Load Models
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
        debug(`✅ Model ${model.name} loaded.`);
      }
    } catch (err) {
      console.error(`❌ Error loading model ${file}:`, err.message);
    }
  });

// 🔗 Set up associations
Object.values(models).forEach(model => {
  if (typeof model.associate === "function") {
    model.associate(models);
    debug(`🔗 Associations set for model: ${model.name}`);
  }
});

// ✅ Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    debug("✅ Connected to main database.");
  } catch (err) {
    console.error("❌ Main DB connection failed:", err.message);
    throw err;
  }
};

// 🧠 Used by initializeTenantModels to dynamically setup models per tenant DB
async function getTenantDatabase(tenantDbName) {
  if (!tenantDbName) throw new Error("❌ Tenant DB name is required.");

  const tenantEnvVar = `TENANT_DB_URL_${tenantDbName.toUpperCase()}`;
  const tenantDbUrl = process.env[tenantEnvVar];
  if (!tenantDbUrl) throw new Error(`❌ Missing env: ${tenantEnvVar}`);

  const dbNameMatch = tenantDbUrl.match(/\/([^\/?]+)(\?.*)?$/);
  const dbName = dbNameMatch ? dbNameMatch[1] : null;
  if (!dbName) throw new Error("❌ Cannot extract DB name from URL");

  const rootDbUrl = tenantDbUrl.replace(`/${dbName}`, '');

  try {
    // 🔑 Root connection (no DB specified) to create/check DB
    const rootSequelize = new Sequelize(rootDbUrl, {
      dialect: 'mysql',
      logging: false
    });

    const [results] = await rootSequelize.query(`SHOW DATABASES LIKE '${dbName}'`);
    if (results.length === 0) {
      await rootSequelize.query(`CREATE DATABASE \`${dbName}\``);
      debug(`✅ Tenant DB '${dbName}' created.`);
    } else {
      debug(`✅ Tenant DB '${dbName}' already exists.`);
    }

    await rootSequelize.close();

    // 🎯 Connect to actual tenant DB
    const tenantSequelize = new Sequelize(tenantDbUrl, {
      dialect: 'mysql',
      logging: debug,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    await tenantSequelize.authenticate();
    debug(`✅ Connected to tenant DB: ${dbName}`);

    return tenantSequelize;
  } catch (err) {
    console.error(`❌ Error setting up tenant DB '${dbName}':`, err.message);
    throw err;
  }
}

// 🏗️ Build models for specific tenant DB
async function initializeTenantModels(tenantDbName) {
  try {
    const tenantSequelize = await getTenantDatabase(tenantDbName);
    const tenantModels = {};

    fs.readdirSync(modelsDirectory)
      .filter(file => file.endsWith(".js") && file !== baseFilename)
      .forEach(file => {
        try {
          const modelFn = require(path.join(modelsDirectory, file));
          if (typeof modelFn === "function") {
            const model = modelFn(tenantSequelize, DataTypes);
            tenantModels[model.name] = model;
            debug(`✅ Tenant model ${model.name} loaded.`);
          }
        } catch (err) {
          console.error(`❌ Error loading tenant model ${file}:`, err.message);
        }
      });

    // 🔗 Associations
    Object.values(tenantModels).forEach(model => {
      if (typeof model.associate === "function") {
        model.associate(tenantModels);
        debug(`🔗 Associations set for tenant model: ${model.name}`);
      }
    });

    debug(`🚀 Tenant models initialized for: ${tenantDbName}`);
    return { sequelize: tenantSequelize, models: tenantModels };
  } catch (err) {
    console.error(`❌ Failed to initialize tenant models for ${tenantDbName}:`, err.message);
    throw err;
  }
}

// ⛓️ Sync main models
const syncModels = async () => {
  try {
    await sequelize.sync({ force: false });
    debug("✅ Main DB models synchronized.");
  } catch (err) {
    console.error("❌ Error syncing main models:", err.message);
    throw err;
  }
};

module.exports = {
  sequelize,
  models,
  testConnection,
  syncModels,
  getTenantDatabase,
  initializeTenantModels
};
