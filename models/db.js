const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'salespilot';

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

async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error executing query:', error.message);
    throw error;
  }
}

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
}

// Sequelize ORM setup
const sequelize = new Sequelize(DB_NAME, process.env.DB_USER || 'root', process.env.DB_PASS || '', {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: false,
});

async function getTenantDatabase() {
  const mysqlPDO = new MySQLPDO();

  try {
    await sequelize.authenticate();
    console.log(`Sequelize connected for database: ${DB_NAME}`);
  } catch (error) {
    console.error(`Sequelize connection error for database ${DB_NAME}:`, error.message);
    process.exit(1);
  }

  return { mysqlPDO, sequelize };
}

// Handle graceful shutdown
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

module.exports = {
  executeQuery,
  getTenantDatabase,
  MySQLPDO,
  sequelize,
};
