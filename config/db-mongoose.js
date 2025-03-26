const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
require('dotenv').config();

// Database configurations
const DB_NAME = process.env.DB_NAME || 'salespilot';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/salespilot';

/**
 * Connect to MongoDB
 */
const connectMongoDB = async () => {
  if (mongoose.connection.readyState !== 0) return; // Prevent multiple connections

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${MONGO_URI}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * MySQL Connection Pool Class
 */
class MySQLPDO {
  constructor() {
    this.pool = null;
    this.poolClosed = false;
    this.initPool();
  }

  async initPool() {
    try {
      await this.ensureDatabaseExists();
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: DB_NAME,
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      await this.pool.query('SELECT 1');
      console.log(`✅ MySQL Connection Pool Initialized: ${DB_NAME}`);
    } catch (error) {
      console.error(`❌ Error initializing MySQL Pool:`, error.message);
      throw error;
    }
  }

  async ensureDatabaseExists() {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });

    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
      console.log(`✅ MySQL Database "${DB_NAME}" is ready.`);
    } catch (error) {
      console.error(`❌ Error creating MySQL database "${DB_NAME}":`, error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  async execute(query, params = []) {
    if (!this.pool) throw new Error('MySQL Connection pool not initialized.');
    try {
      const [results] = await this.pool.execute(query, params);
      return results;
    } catch (error) {
      console.error('❌ MySQL Query failed:', error.message);
      throw error;
    }
  }

  async closePool() {
    if (this.poolClosed || !this.pool) return;
    try {
      await this.pool.end();
      this.poolClosed = true;
      console.log('✅ MySQL Connection Pool Closed.');
    } catch (error) {
      console.error('❌ Error closing MySQL Connection Pool:', error.message);
      throw error;
    }
  }
}

/**
 * Initialize Sequelize ORM with connection pooling
 */
const createSequelizeInstance = () => {
  console.log('Sequelize connecting to MySQL database:', DB_NAME);
  return new Sequelize(DB_NAME, process.env.DB_USER || 'root', process.env.DB_PASS || '', {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
};

/**
 * Initialize all database connections
 */
const initializeDatabases = async () => {
  await connectMongoDB(); // Connect to MongoDB

  const mysqlPDO = new MySQLPDO();
  const sequelize = createSequelizeInstance();

  try {
    await sequelize.authenticate();
    console.log(`✅ Sequelize connected to MySQL: ${DB_NAME}`);
  } catch (error) {
    console.error(`❌ Sequelize connection error:`, error.message);
    process.exit(1);
  }

  return { mysqlPDO, sequelize, mongoose };
};

/**
 * Graceful Shutdown Handling
 */
const handleShutdown = async () => {
  console.log('⚠️ Gracefully shutting down...');

  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');

    if (sequelize) await sequelize.close();
    console.log('✅ Sequelize connection closed.');
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Export modules
module.exports = {
  initializeDatabases,
  MySQLPDO,
};

// FOR APP.JS
if (require.main === module) {
  (async () => {
    const { mysqlPDO, sequelize, mongoose } = await initializeDatabases();
  })();
}
