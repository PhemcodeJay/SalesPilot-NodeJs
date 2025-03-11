const jwt = require("jsonwebtoken");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const { publicRoutes } = require("../config/constants");

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    console.log(`[INFO] Public route accessed: ${req.path}, skipping authentication.`);
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[WARNING] Missing or invalid authentication token.");
    return res.status(401).json({ message: "Authentication token is missing or invalid." });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!process.env.JWT_SECRET) {
      console.error("[ERROR] Missing JWT_SECRET in environment variables.");
      return res.status(500).json({ message: "Internal server error." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId || !decoded.tenantId) {
      console.error("[ERROR] Invalid token payload.");
      return res.status(403).json({ message: "Invalid authentication token." });
    }

    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role || "user",
    };

    console.log(`[INFO] Authenticated User: ${JSON.stringify(req.user)}`);
    next();
  } catch (error) {
    console.error("[ERROR] Token verification failed:", error.message);
    return res.status(403).json({ message: "Invalid authentication token." });
  }
};

// Middleware for validating user signup
const validateSignup = [
  body("username").notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("role").isIn(["admin", "sales", "inventory"]).withMessage("Invalid role"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Middleware for validating user login
const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Middleware for validating password reset
const validateResetPassword = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  authMiddleware,
  validateSignup,
  validateLogin,
  validateResetPassword,
};
