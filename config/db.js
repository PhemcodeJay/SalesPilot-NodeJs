const { Sequelize } = require('sequelize');
require('dotenv').config();

// MySQL Database configuration
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'salespilot',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  logging: false, // Disable SQL query logging
  define: {
    timestamps: true, // Enable timestamps (createdAt, updatedAt) in all models
    underscored: true, // Use snake_case for all column names
  },
});

// Test connection to the database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Sync all models with the database (this creates the tables if they do not exist)
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true }); // Alter = auto update schema
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

module.exports = { sequelize, testConnection, syncModels };
