const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Define the database name from environment variables
const DB_NAME = process.env.DB_NAME || 'salespilot'; // Default to 'salespilot' if not defined in .env

// Database pool setup
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});



// Function to execute queries
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', error.message);
    throw error;
  }
}

// MySQLPDO class for direct database operations
class MySQLPDO {
  constructor() {
    this.pool = null;
    this.poolClosed = false;
    this.initPool(); // Initialize pool
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
      console.log(`Connection pool initialized for database: ${DB_NAME}`);
    } catch (error) {
      console.error(`Error initializing pool for ${DB_NAME}:`, error.message);
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
      console.log(`Database "${DB_NAME}" created or already exists.`);
    } catch (error) {
      console.error(`Error creating database "${DB_NAME}":`, error.message);
      throw error;
    } finally {
      await connection.end();
    }
  }

  async execute(query, params = []) {
    if (!this.pool) throw new Error('Connection pool not initialized.');
    try {
      const [results] = await this.pool.execute(query, params);
      return results;
    } catch (error) {
      console.error('Query failed:', error.message);
      throw error;
    }
  }

  async getConnection() {
    if (!this.pool) throw new Error('Connection pool not initialized.');
    return await this.pool.getConnection();
  }

  async closePool() {
    if (this.poolClosed || !this.pool) return;
    try {
      await this.pool.end();
      this.poolClosed = true;
      console.log('Connection pool closed.');
    } catch (error) {
      console.error('Error closing connection pool:', error.message);
      throw error;
    }
  }

  async healthCheck() {
    try {
      await this.pool.query('SELECT 1');
      console.log('Connection pool is healthy.');
    } catch (error) {
      console.error('Health check failed:', error.message);
      throw error;
    }
  }
}

// Sequelize instance for ORM
const createSequelizeInstance = () => {
  return new Sequelize(DB_NAME, process.env.DB_USER || 'root', process.env.DB_PASS || '', {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  });
};

// Function to get tenant database
const getTenantDatabase = () => {
  const mysqlPDO = new MySQLPDO();
  const sequelize = createSequelizeInstance();

  sequelize.authenticate()
    .then(() => console.log(`Sequelize connected for database: ${DB_NAME}`))
    .catch((error) => {
      console.error(`Sequelize connection error for database ${DB_NAME}:`, error.message);
      process.exit(1);
    });

  return { mysqlPDO, sequelize };
};

// Gracefully shutdown on process termination
process.on('SIGINT', async () => {
  console.log('Gracefully shutting down...');
  try {
    await sequelize.close();
    console.log('Sequelize connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
});

// Export functions
module.exports = {
  executeQuery,
  getTenantDatabase,
  MySQLPDO,  // Export the MySQLPDO class so it can be used elsewhere
};