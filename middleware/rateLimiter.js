// middleware/rateLimiter.js

const rateLimit = (req, res, next) => {
  // Basic in-memory store to keep track of requests (could be improved with Redis, etc.)
  const ip = req.ip;  // Get user IP address
  const currentTime = Date.now();
  const timeWindow = 15 * 60 * 1000;  // 15 minutes
  const maxRequests = 100;  // Allow 100 requests per IP within the time window

  if (!req.app.locals.requests) req.app.locals.requests = {};

  // Initialize request log if it doesn't exist
  if (!req.app.locals.requests[ip]) {
    req.app.locals.requests[ip] = [];
  }

  // Remove requests that are outside the time window
  req.app.locals.requests[ip] = req.app.locals.requests[ip].filter(
    timestamp => currentTime - timestamp < timeWindow
  );

  // Check if the IP has exceeded the max requests
  if (req.app.locals.requests[ip].length >= maxRequests) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  // Add the current timestamp to the request log
  req.app.locals.requests[ip].push(currentTime);

  // Proceed to the next middleware or route handler
  next();
};

module.exports = rateLimit;
