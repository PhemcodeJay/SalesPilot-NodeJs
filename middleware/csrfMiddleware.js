const csrf = require("csurf");
const cookieParser = require("cookie-parser");

const csrfMiddleware = (app) => {
  // Use Cookie Parser for CSRF token management
  app.use(cookieParser());

  // CSRF Protection Middleware
  const csrfProtection = csrf({ cookie: true });

  app.use(csrfProtection);

  // Provide CSRF token to frontend
  app.use((req, res, next) => {
    res.cookie("XSRF-TOKEN", req.csrfToken(), { httpOnly: false, secure: process.env.NODE_ENV === "production" });
    next();
  });

  // Handle CSRF Errors
  app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).json({ message: "Invalid CSRF token" });
    }
    next(err);
  });
};

module.exports = csrfMiddleware;
//     res.status(200).json({ message: 'Account activated' });