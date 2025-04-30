// middleware/errorLogger.js

const { logError } = require('../utils/logger');

// Handles Express errors and logs them
const errorLogger = (err, req, res, next) => {
  logError(`Unhandled error in ${req.method} ${req.url}`, err);

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
};

module.exports = errorLogger;
