require('dotenv').config(); // ✅ Always load this at the very top

const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("models");

// 🌐 Main App Database (e.g., Admin DB)
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
        const model = modelFn(sequelize, DataTypes); // Use the main DB connection (sequelize)
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

// 🏗️ Sync models with the main DB
const syncModels = async () => {
  try {
    await sequelize.sync({ force: false });  // Sync models with the database
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
  syncModels
};
