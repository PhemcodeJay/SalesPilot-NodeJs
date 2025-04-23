const rateLimit = require('express-rate-limit');

// Global API Rate Limiter: 1000 requests per 25 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 25 * 60 * 1000, // 25 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Include rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

module.exports = apiLimiter;
