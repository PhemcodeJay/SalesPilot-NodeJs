const csrf = require("csurf");
const cookieParser = require("cookie-parser");

const csrfMiddleware = (app) => {
  // ✅ Use Cookie Parser for CSRF token management
  app.use(cookieParser());

  // ✅ Initialize CSRF Protection Middleware
  const csrfProtection = csrf({ cookie: true });
  app.use(csrfProtection);

  // ✅ Set CSRF Token in Cookies & EJS Templates
  app.use((req, res, next) => {
    const csrfToken = req.csrfToken();
    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false, // Allows frontend to access
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.locals.csrfToken = csrfToken; // For rendering in EJS
    next();
  });

  // ✅ Handle CSRF Errors Gracefully
  app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).json({ message: "Invalid CSRF token" });
    }
    next(err);
  });
};

module.exports = csrfMiddleware;
