const { Sequelize, DataTypes } = require("sequelize");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const debug = require("debug")("db");

// ✅ Load Environment Variables
const DB_NAME = process.env.DB_NAME || "salespilot";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "1234";
const DB_PORT = process.env.DB_PORT || 3306;
const DB_SSL = process.env.DB_SSL === "true"; // SSL toggle

// ✅ MySQL Connection Pool
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  ssl: DB_SSL ? { rejectUnauthorized: true } : undefined, // Proper SSL handling
});

// ✅ Test MySQL Connection
async function testPoolConnection() {
  try {
    const connection = await pool.getConnection();
    debug(`✅ MySQL pool connected to database: ${DB_NAME}`);
    connection.release();
  } catch (error) {
    console.error(`❌ MySQL pool connection error: ${error.message}`);
    process.exit(1);
  }
}

// ✅ Execute Raw SQL Queries
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error("❌ SQL Query Error:", error.message);
    throw error;
  }
}

// ✅ Sequelize Connection
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: "mysql",
  port: DB_PORT,
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: false,
  },
  pool: {
    max: 15,
    min: 5,
    acquire: 20000,
    idle: 5000,
  },
  retry: { max: 3 }, // Reduced retries for faster failure detection
  dialectOptions: DB_SSL ? { ssl: { rejectUnauthorized: true } } : {},
});

// ✅ Authenticate Sequelize Connection
async function connectSequelize() {
  try {
    await sequelize.authenticate();
    debug(`✅ Sequelize connected to: ${DB_NAME}`);
  } catch (error) {
    console.error(`❌ Sequelize connection error: ${error.message}`);
    process.exit(1);
  }
}

// ✅ Load Sequelize Models
const models = {};
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
      console.error(`❌ Model Load Error (${file}):`, error.message);
    }
  });

// ✅ Associate Models
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// ✅ Sync all models
sequelize
  .sync()
  .then(() => debug("✅ All models synchronized successfully"))
  .catch((err) => console.error("❌ Sequelize Sync Error:", err));

// ✅ Tenant Database Handling
const tenantConnections = new Map();

/**
 * Get or create a tenant-specific Sequelize instance.
 * @param {string} tenantDbName - The tenant's database name
 * @returns {Promise<Sequelize>}
 */
async function getTenantDatabase(tenantDbName) {
  if (!tenantDbName) throw new Error("Tenant database name is required.");
  if (tenantConnections.has(tenantDbName)) return tenantConnections.get(tenantDbName);

  try {
    // Check if the database exists before creating a new connection
    const [dbExists] = await executeQuery(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [tenantDbName]
    );

    if (!dbExists.length) {
      debug(`⚠️ Tenant database ${tenantDbName} does not exist. Creating it...`);
      await executeQuery(`CREATE DATABASE ${tenantDbName}`);
      debug(`✅ Tenant database created: ${tenantDbName}`);
    }

    const tenantSequelize = new Sequelize(tenantDbName, DB_USER, DB_PASS, {
      host: DB_HOST,
      dialect: "mysql",
      port: DB_PORT,
      logging: false,
      define: {
        freezeTableName: true,
        timestamps: false,
      },
      pool: {
        max: 10,
        min: 2,
        acquire: 20000,
        idle: 5000,
      },
    });

    await tenantSequelize.authenticate();
    debug(`✅ Connected to tenant database: ${tenantDbName}`);

    tenantConnections.set(tenantDbName, tenantSequelize);
    return tenantSequelize;
  } catch (error) {
    console.error(`❌ Tenant DB Connection Error (${tenantDbName}):`, error.message);
    throw error;
  }
}

/**
 * Close a tenant database connection.
 * @param {string} tenantDbName
 */
async function closeTenantConnection(tenantDbName) {
  if (tenantConnections.has(tenantDbName)) {
    try {
      await tenantConnections.get(tenantDbName).close();
      debug(`🔌 Closed tenant connection: ${tenantDbName}`);
      tenantConnections.delete(tenantDbName);
    } catch (error) {
      console.error(`❌ Error closing tenant DB ${tenantDbName}:`, error.message);
    }
  }
}

// ✅ Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("🔄 Gracefully shutting down...");
  try {
    await sequelize.close();
    debug("✅ Main Sequelize connection closed.");

    // Close all tenant connections
    await Promise.all([...tenantConnections.keys()].map(closeTenantConnection));

    process.exit(0);
  } catch (error) {
    console.error("❌ Shutdown Error:", error.message);
    process.exit(1);
  }
});

// ✅ Test connections before exporting
(async () => {
  await testPoolConnection();
  await connectSequelize();
})();

// ✅ Export Modules
module.exports = {
  executeQuery,
  sequelize,
  getTenantDatabase,
  closeTenantConnection,
  DataTypes,
  models,
};
