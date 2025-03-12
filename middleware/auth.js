const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const tenantConnections = {}; // Store database connections per tenant
const MAX_DB_CONNECTIONS = 100; // Limit concurrent connections

// 🔹 Get database connection for a specific tenant
function getTenantDatabase(tenantId) {
  if (!tenantConnections[tenantId]) {
    tenantConnections[tenantId] = new Sequelize(
      `${process.env.DB_NAME}_${tenantId}`,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: "mysql",
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
      }
    );
  }

  // Cleanup if too many connections
  if (Object.keys(tenantConnections).length > MAX_DB_CONNECTIONS) {
    console.warn("⚠️ Too many database connections! Consider closing inactive ones.");
  }

  return tenantConnections[tenantId];
}

// 🔹 Get or define a model for the tenant
async function getTenantModel(tenantId, modelName) {
  const db = getTenantDatabase(tenantId);

  if (!db.models[modelName]) {
    if (modelName === "User") {
      db.define("User", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        username: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.ENUM("admin", "sales", "inventory"), allowNull: false },
        tenantId: { type: DataTypes.INTEGER, allowNull: false },
      });

      await db.sync(); // Ensure the table exists
    }
  }

  return db.models[modelName];
}

// 🔹 Hash password before saving
async function hashPassword(password) {
  return await bcrypt.hash(password, 10); // Salt rounds = 10
}

// 🔹 Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// 🔹 Public Routes List
const publicRoutes = ["/", "/home", "/login", "/signup", "/about"];

// 🔹 Authentication Middleware
async function authenticateUser(req, res, next) {
  if (publicRoutes.includes(req.path)) {
    console.log(`✅ Public route accessed: ${req.path}, skipping auth check.`);
    return next();
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("🔹 No authorization header found.");
    return res.status(401).json({ error: "Unauthorized: Token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Store user info in `req.user`

    // Get User and attach tenantId
    const UserModel = await getTenantModel(req.user.tenantId, "User");
    const user = await UserModel.findByPk(req.user.id);

    if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });

    req.user.tenantId = user.tenantId; // Attach tenantId for easy access
    next();
  } catch (error) {
    console.warn("🔹 Invalid or expired token.");
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
}

// 🔹 Role-Based Access Middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }
    next();
  };
}

// 🔹 Validation Middleware (Signup)
const validateSignup = [
  body("username").notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("role").isIn(["admin", "sales", "inventory"]).withMessage("Invalid role"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    req.body.password = await hashPassword(req.body.password);
    next();
  },
];

// 🔹 Validation Middleware (Login)
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

// 🔹 Validation Middleware (Reset Password)
const validateResetPassword = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    req.body.newPassword = await hashPassword(req.body.newPassword);
    next();
  },
];

// 🔹 Export middleware functions
module.exports = {
  getTenantDatabase,
  getTenantModel,
  authenticateUser,
  authorizeRoles,
  validateSignup,
  validateLogin,
  validateResetPassword,
};
