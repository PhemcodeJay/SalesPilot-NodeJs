require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const flash = require("connect-flash");
const path = require("path");
const debug = require("debug")("app");
const { sequelize, models } = require("./db"); // ✅ Use db.js for DB connection

const configurePassport = require("./passport"); // Ensure passport.js is structured properly
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const SESSION_SECRET = process.env.SESSION_SECRET || "supersecretkey";

// ✅ **Security & Logging Middleware**
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(morgan("dev"));

// ✅ **Body Parsers**
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ **Session Setup**
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// ✅ **Flash Messages**
app.use(flash());

// ✅ **Initialize Passport**
app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport, models.User); // ✅ Pass User model explicitly

// ✅ **Global Middleware for Flash Messages & User Data**
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.user = req.user || null;
  next();
});

// ✅ **Static File Serving**
app.use(express.static(path.join(__dirname, "public")));

// ✅ **Routes**
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);

// ✅ **404 Handler**
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint Not Found" });
});

// ✅ **Global Error Handler**
app.use((err, req, res) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ **Database Connection Check**
(async () => {
  try {
    await sequelize.authenticate();
    debug(`✅ Database connected!`);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1);
  }
})();

// ✅ **Start Server**
app.listen(PORT, () => {
  debug(`✅ Server running on http://localhost:${PORT}`);
});
