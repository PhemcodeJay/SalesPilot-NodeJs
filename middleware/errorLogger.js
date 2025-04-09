const fs = require('fs');
const path = require('path');

const errorLogStream = fs.createWriteStream(path.join(__dirname, '../logs/error.log'), { flags: 'a' });

const errorLogger = (err, req, res, next) => {
  const errorMessage = `
    [${new Date().toISOString()}] - Error occurred:
    ${err.message}
    Stack: ${err.stack}
  `;

  // Log the error to file
  errorLogStream.write(errorMessage + '\n');

  // Send the error response
  res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = errorLogger;
