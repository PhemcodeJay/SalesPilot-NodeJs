require('dotenv').config();
const { Sequelize, DataTypes, Transaction } = require('sequelize');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('app:db');

// Configuration Constants
const DEFAULT_POOL_CONFIG = {
  max: parseInt(process.env.DB_POOL_MAX) || 5,
  min: parseInt(process.env.DB_POOL_MIN) || 0,
  acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
  idle: parseInt(process.env.DB_POOL_IDLE) || 10000
};
const MODEL_FILE_PATTERN = /\.model\.js$/i; // Only files ending with .model.js

/**
 * Validates a loaded model to ensure it has the required structure
 * @param {Function} modelFn - The model function to validate
 * @returns {boolean} True if valid, false otherwise
 */
const validateModel = (modelFn) => {
  return typeof modelFn === 'function' && 
         modelFn.length === 2; // Should accept (sequelize, DataTypes)
};

// 🌐 Main Admin DB Setup
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("❌ DATABASE_URL is not set in .env");

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  logging: debug.enabled ? debug : false,
  pool: DEFAULT_POOL_CONFIG,
  retry: {
    max: 3,
    timeout: 5000
  }
});

// 📦 Improved Model Loading with Validation
/**
 * Dynamically loads and validates Sequelize models from the specified directory
 * @param {Sequelize} sequelizeInstance - Sequelize instance
 * @param {string} [modelsDirectory=__dirname] - Directory to load models from
 * @returns {Object} Dictionary of loaded models
 */
const loadModels = (sequelizeInstance, modelsDirectory = __dirname) => {
  const models = {};
  const baseFilename = path.basename(__filename);

  fs.readdirSync(modelsDirectory)
    .filter(file => MODEL_FILE_PATTERN.test(file) && file !== baseFilename)
    .forEach(file => {
      try {
        const filePath = path.join(modelsDirectory, file);
        const modelFn = require(filePath);
        
        if (!validateModel(modelFn)) {
          debug(`⚠️  Skipping invalid model file: ${file}`);
          return;
        }

        const model = modelFn(sequelizeInstance, DataTypes);
        models[model.name] = model;
        debug(`✅ Model loaded: ${model.name} from ${file}`);
      } catch (err) {
        console.error(`❌ Error loading model ${file}:`, err.message);
        throw err; // Rethrow to prevent silent failures
      }
    });

  return models;
};

// 📦 Load Admin Models
const models = loadModels(sequelize);

// 🧩 Set Associations with Validation
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    try {
      model.associate(models);
      debug(`🔗 Associations set for: ${model.name}`);
    } catch (err) {
      console.error(`❌ Error setting associations for ${model.name}:`, err.message);
      throw err;
    }
  }
});

// 🧩 Tenant DB Management with Enhanced Caching
const tenantDbCache = new Map();

/**
 * Gets or creates a tenant database connection
 * @param {string} dbName - Name of the tenant database
 * @returns {Object} Tenant DB instance with sequelize and models
 * @throws {Error} If tenant DB cannot be created
 */
const getTenantDb = (dbName) => {
  if (!dbName) throw new Error('❌ Tenant DB name is required');
  
  // Check cache first
  if (tenantDbCache.has(dbName)) {
    return tenantDbCache.get(dbName);
  }

  const envKey = `TENANT_DB_URL_${dbName.toUpperCase()}`;
  const customDbUrl = process.env[envKey];

  const tenantSequelize = new Sequelize(
    customDbUrl || dbName,
    customDbUrl ? undefined : process.env.DB_USER,
    customDbUrl ? undefined : process.env.DB_PASS,
    {
      host: customDbUrl ? undefined : process.env.DB_HOST,
      dialect: 'mysql',
      logging: debug.enabled ? debug : false,
      pool: DEFAULT_POOL_CONFIG,
      retry: {
        max: 3,
        timeout: 5000
      }
    }
  );

  const tenantModels = loadModels(tenantSequelize);

  const tenantDb = {
    sequelize: tenantSequelize,
    models: tenantModels,
    lastAccessed: Date.now()
  };

  tenantDbCache.set(dbName, tenantDb);
  debug(`🌐 New tenant DB connection created: ${dbName}`);

  return tenantDb;
};

// 🧩 Enhanced Multi-DB Transaction Handling
/**
 * Inserts data into both main and tenant databases with transaction safety
 * @param {Object} mainDbData - Data for main database
 * @param {Object} tenantDbData - Data for tenant database
 * @param {string} tenantDbName - Name of tenant database
 * @param {Object} [options] - Transaction options
 * @param {number} [options.isolationLevel] - Transaction isolation level
 * @returns {Promise<void>}
 */
const insertIntoBothDb = async (mainDbData, tenantDbData, tenantDbName, options = {}) => {
  const mainTransaction = await sequelize.transaction({
    isolationLevel: options.isolationLevel || Transaction.ISOLATION_LEVELS.READ_COMMITTED
  });
  
  const tenantDb = getTenantDb(tenantDbName);
  const tenantTransaction = await tenantDb.sequelize.transaction({
    isolationLevel: options.isolationLevel || Transaction.ISOLATION_LEVELS.READ_COMMITTED
  });

  try {
    // Main DB operations
    const mainDbUser = await models.User.create(mainDbData, { transaction: mainTransaction });
    const mainDbTenant = await models.Tenant.create(
      { userId: mainDbUser.id, ...mainDbData.tenant }, 
      { transaction: mainTransaction }
    );

    // Tenant DB operations
    await tenantDb.models.Product.create(tenantDbData.product, { transaction: tenantTransaction });
    await tenantDb.models.Order.create(tenantDbData.order, { transaction: tenantTransaction });

    // Commit both transactions
    await Promise.all([
      mainTransaction.commit(),
      tenantTransaction.commit()
    ]);

    debug('✅ Data inserted successfully into both main and tenant databases');
  } catch (err) {
    // Rollback both transactions if either fails
    await Promise.allSettled([
      mainTransaction.rollback(),
      tenantTransaction.rollback()
    ]);
    
    debug('❌ Error in multi-DB transaction:', err.message);
    throw new Error(`Multi-DB operation failed: ${err.message}`);
  }
};

// 🧩 Database Health Checks
/**
 * Tests connection to the main database
 * @throws {Error} If connection fails
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    debug('✅ Connected to Main Admin database.');
  } catch (err) {
    console.error('❌ Admin DB connection failed:', err.message);
    throw new Error(`Main DB connection failed: ${err.message}`);
  }
};

/**
 * Tests connection to a tenant database
 * @param {string} dbName - Name of tenant database
 * @throws {Error} If connection fails
 */
const testTenantConnection = async (dbName) => {
  try {
    const tenantDb = getTenantDb(dbName);
    await tenantDb.sequelize.authenticate();
    debug(`✅ Connected to Tenant database: ${dbName}`);
  } catch (err) {
    console.error(`❌ Tenant DB connection failed (${dbName}):`, err.message);
    throw new Error(`Tenant DB (${dbName}) connection failed: ${err.message}`);
  }
};

// 🧩 Model Synchronization
/**
 * Synchronizes all models with the database
 * @param {boolean} [force=false] - Whether to force sync (drop tables)
 * @param {boolean} [alter=false] - Whether to alter tables
 */
const syncModels = async ({ force = false, alter = false } = {}) => {
  try {
    await sequelize.sync({ force, alter });
    debug(`✅ Main DB models synced (force: ${force}, alter: ${alter})`);
  } catch (err) {
    console.error('❌ Error syncing main DB models:', err.message);
    throw err;
  }
};

/**
 * Synchronizes all models for a tenant database
 * @param {string} dbName - Name of tenant database
 * @param {boolean} [force=false] - Whether to force sync (drop tables)
 * @param {boolean} [alter=false] - Whether to alter tables
 */
const syncTenantModels = async (dbName, { force = false, alter = false } = {}) => {
  try {
    const tenantDb = getTenantDb(dbName);
    await tenantDb.sequelize.sync({ force, alter });
    debug(`✅ Tenant DB (${dbName}) models synced (force: ${force}, alter: ${alter})`);
  } catch (err) {
    console.error(`❌ Error syncing tenant DB (${dbName}) models:`, err.message);
    throw err;
  }
};

// 🧩 Connection Management
/**
 * Closes all database connections
 */
const closeAllConnections = async () => {
  try {
    // Close main DB connection
    await sequelize.close();
    debug('✅ Main DB connection closed');
    
    // Close all tenant DB connections
    const closePromises = Array.from(tenantDbCache.values()).map(db => 
      db.sequelize.close().then(() => {
        debug(`✅ Tenant DB connection closed: ${db.sequelize.config.database}`);
      })
    );
    
    await Promise.allSettled(closePromises);
    tenantDbCache.clear();
  } catch (err) {
    console.error('❌ Error closing DB connections:', err.message);
    throw err;
  }
};

// 🧩 Periodic Connection Cleanup (for long-running apps)
setInterval(() => {
  const now = Date.now();
  const MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
  
  for (const [dbName, db] of tenantDbCache.entries()) {
    if (now - db.lastAccessed > MAX_IDLE_TIME) {
      db.sequelize.close().then(() => {
        tenantDbCache.delete(dbName);
        debug(`♻️  Closed idle tenant DB connection: ${dbName}`);
      }).catch(err => {
        debug(`❌ Error closing idle tenant DB ${dbName}:`, err.message);
      });
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes

// 🧩 Export everything
module.exports = {
  sequelize,
  models,
  getTenantDb,
  
  // Connection management
  testConnection,
  testTenantConnection,
  closeAllConnections,
  
  // Model synchronization
  syncModels,
  syncTenantModels,
  
  // Operations
  insertIntoBothDb,
  
  // Constants (for testing/configuration)
  DEFAULT_POOL_CONFIG,
  MODEL_FILE_PATTERN
};