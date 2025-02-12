const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const tenantConnections = {}; // Store connections per tenant

function getTenantDatabase(tenantId) {
  if (!tenantConnections[tenantId]) {
    tenantConnections[tenantId] = new Sequelize(process.env.DB_NAME + '_' + tenantId, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    });
  }
  return tenantConnections[tenantId];
}

function getTenantModel(tenantId, modelName) {
  const db = getTenantDatabase(tenantId);

  if (!db.models[modelName]) {
    if (modelName === 'User') {
      db.define('User', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        username: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM('admin', 'sales', 'inventory'), allowNull: false },
        tenantId: { type: DataTypes.INTEGER, allowNull: false },
      });
    }
  }
  
  return db.models[modelName];
}

module.exports = { getTenantDatabase, getTenantModel };