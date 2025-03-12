require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { authenticateUser } = require("./middleware/auth");
const tenancyMiddleware = require("./middleware/tenancyMiddleware");
const { checkAndDeactivateSubscriptions } = require("./controllers/subscriptioncontroller");
const { getTenantDatabase } = require("./config/db");
const tenantService = require("./services/tenantservices");
const rateLimiter = require("./middleware/rateLimiter");

// ✅ Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Load Passport Configuration
require("./config/passport")(passport);

// ✅ Middleware Setup
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL || "http://localhost:5000" }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
      maxAge: 24 * 60 * 60 * 1000, // 1 day
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

// ✅ Public Routes (No Authentication Required)
app.get("/", (req, res) => {
  console.log("✅ Public route accessed: /");
  res.render("home/index", { title: "Home" });
});
app.get("/home", (req, res) => {
  console.log("✅ Public route accessed: /home, skipping auth check.");
  res.render("home/index", { title: "Home" });
});
app.get("/login", (req, res) => {
  console.log("✅ Public route accessed: /login");
  res.render("auth/login", { title: "Login" });
});
app.get("/signup", (req, res) => {
  console.log("✅ Public route accessed: /signup");
  res.render("auth/signup", { title: "Signup" });
});

// ✅ Apply Authentication Middleware **Only to Protected Routes**
app.use("/dashboard", authenticateUser);
app.use("/invoice", authenticateUser);
app.use("/sales", authenticateUser);
app.use("/product", authenticateUser);
app.use("/customer", authenticateUser);
app.use("/inventory", authenticateUser);
app.use("/subscription", authenticateUser);
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
};

Object.entries(routes).forEach(([name, route]) => {
  if (route) {
    app.use(`/${name}`, route);
  } else {
    console.error(`❌ Route '${name}' is undefined! Check your route imports.`);
  }
});

// ✅ 404 Error Handling
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

module.exports = app;
