const csrf = require("csurf");
const cookieParser = require("cookie-parser");

// Set up CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

module.exports = (app) => {
  app.use(cookieParser()); // Use cookie parser for CSRF token storage
  app.use(csrfProtection);

  // Middleware to send CSRF token in a cookie
  app.use((req, res, next) => {
    res.cookie("XSRF-TOKEN", req.csrfToken(), { httpOnly: false, secure: true });
    next();
  });

  // CSRF error handler
  app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).send("CSRF token validation failed");
    }
    next(err);
  });
};
