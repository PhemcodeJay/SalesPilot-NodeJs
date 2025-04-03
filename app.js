require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { sequelize, models } = require("./models"); // ✅ Load Sequelize & Models

const { authenticateUser } = require("./middleware/auth");
const tenancyMiddleware = require("./middleware/tenancyMiddleware");
const { checkAndDeactivateSubscriptions } = require("./controllers/subscriptioncontroller");
const rateLimiter = require("./middleware/rateLimiter");
// ✅ Import PageAccessController
const PageAccessController = require("./controllers/PageAccessController");
const passwordResetRoute = require("./routes/PasswordResetRoute");


// ✅ Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Load Passport Configuration (Ensure models are loaded first)
require("./config/passport")(passport, models);

// ✅ Security & Logging Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL || "http://localhost:5000" }));
app.use(cookieParser());

// ✅ Body Parsers (Removed redundant body-parser)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Rate Limiting
app.use(rateLimiter);

// ✅ Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ✅ Initialize Passport & Flash Messages
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ✅ View Engine Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Serve Static Public Folders
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use("/home_assets", express.static(path.join(__dirname, "public/home_assets")));

// ✅ Public Routes
app.get("/", (req, res) => res.render("home/index", { title: "Home" }));
app.get("/home", (req, res) => res.render("home/index", { title: "Home" }));
app.get("/login", (req, res) => res.render("auth/login", { title: "Login" }));
app.get("/signup", (req, res) => res.render("auth/signup", { title: "Signup" }));

// ✅ Apply Authentication Middleware to Protected Routes
const protectedRoutes = ["/dashboard", "/invoice", "/sales", "/product", "/customer", "/inventory", "/subscription"];
protectedRoutes.forEach((route) => app.use(route, authenticateUser));

// ✅ Apply Tenancy Middleware
app.use(tenancyMiddleware);

// ✅ Import & Apply Routes
const routes = {
  auth: require("./routes/authRoute"),
  dashboard: require("./routes/dashboardRoute"),
  invoice: require("./routes/invoiceRoute"),
  sales: require("./routes/salesRoute"),
  product: require("./routes/productRoute"),
  customer: require("./routes/customerRoute"),
  inventory: require("./routes/inventoryRoute"),
  subscription: require("./routes/subscriptionRoute"),
  pageAccess: require("./routes/pageAccessRoute"), 
};
app.use("/password-resets", passwordResetRoute);
// ✅ Apply Routes Dynamically & Handle Errors
Object.entries(routes).forEach(([name, route]) => {
  try {
    if (!route) throw new Error(`Route '${name}' is undefined`);
    app.use(`/${name}`, route);
  } catch (error) {
    console.error(`❌ Error loading route '${name}':`, error.message);
  }
});

// ✅ 404 Error Handling
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Sync Database & Start Server
sequelize
  .sync()
  .then(() => {
    console.log("✅ Database connected successfully.");
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ Database connection error:", err));

module.exports = app;
