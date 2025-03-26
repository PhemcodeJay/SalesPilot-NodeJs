const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Load database config from environment variables
const DB_NAME = process.env.DB_NAME || 'salespilot';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_PORT = process.env.DB_PORT || 3306;

class Database {
  constructor() {
    this.pool = null;
    this.poolClosed = false;
    this.sequelize = null;
    this.init();
  }

  /** Initialize both Sequelize and MySQL connection pool */
  async init() {
    await this.ensureDatabaseExists();
    this.initMySQLPool();
    this.initSequelize();
  }

  /** Ensure the database exists before connecting */
  async ensureDatabaseExists() {
    try {
      const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
      console.log(`✅ Database "${DB_NAME}" is ready.`);
      await connection.end();
    } catch (error) {
      console.error(`❌ Error creating database "${DB_NAME}":`, error.message);
      throw error;
    }
  }

  /** Initialize MySQL connection pool for raw queries */
  initMySQLPool() {
    this.pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log(`✅ MySQL connection pool initialized for "${DB_NAME}".`);
  }

  /** Initialize Sequelize ORM */
  initSequelize() {
    this.sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
      host: DB_HOST,
      dialect: 'mysql',
      logging: false,
    });

    this.sequelize
      .authenticate()
      .then(() => console.log(`✅ Sequelize connected to "${DB_NAME}".`))
      .catch((error) => {
        console.error(`❌ Sequelize connection error:`, error.message);
        process.exit(1);
      });
  }

  /** Execute raw SQL queries using MySQL connection pool */
  async executeQuery(query, params = []) {
    if (!this.pool) throw new Error('Connection pool is not initialized.');
    try {
      const [results] = await this.pool.execute(query, params);
      return results;
    } catch (error) {
      console.error('❌ Query execution error:', error.message);
      throw error;
    }
  }

  /** Close both Sequelize and MySQL connection pool */
  async closeConnections() {
    try {
      if (this.sequelize) {
        await this.sequelize.close();
        console.log('✅ Sequelize connection closed.');
      }

      if (this.pool && !this.poolClosed) {
        await this.pool.end();
        this.poolClosed = true;
        console.log('✅ MySQL connection pool closed.');
      }
    } catch (error) {
      console.error('❌ Error closing connections:', error.message);
    }
  }
}

// Create a singleton instance of the Database class
const db = new Database();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('⚠️ Gracefully shutting down...');
  await db.closeConnections();
  process.exit(0);
});

module.exports = {
  db, // Exports the singleton database instance
  sequelize: db.sequelize, // Sequelize instance
  executeQuery: db.executeQuery.bind(db), // Function for raw queries
};
