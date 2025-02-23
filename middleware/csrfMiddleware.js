const csrf = require("csurf");
const cookieParser = require("cookie-parser");

const csrfMiddleware = (app) => {
  // Use Cookie Parser for CSRF token management
  app.use(cookieParser());

  // CSRF Protection Middleware
  const csrfProtection = csrf({ cookie: true });
  app.use(csrfProtection);

  // ✅ Set CSRF Token in Cookie for Frontend
  app.use((req, res, next) => {
    const csrfToken = req.csrfToken();
    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false, // Allow frontend to read it
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.locals.csrfToken = csrfToken; // For rendering templates
    next();
  });

  // ✅ Handle CSRF Errors Properly
  app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).json({ message: "Invalid CSRF token" });
    }
    next(err);
  });
};

module.exports = csrfMiddleware;
