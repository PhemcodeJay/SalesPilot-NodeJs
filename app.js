const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const { testConnection, syncModels } = require('./models/db');
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const subscriptionRoute = require('./routes/subscriptionRoute');
const pageAccessRoute = require('./routes/PageAccessRoute');
const passwordResetRoutes = require('./routes/passwordresetRoute');
const errorLogger = require('./middleware/errorLogger'); // Custom error logging middleware
const tenantMiddleware = require('./middleware/tenantMiddleware');
const authenticateUser = require('./middleware/authenticateUser'); // Custom authentication middleware

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser()); // For parsing cookies
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)

// ✅ Security & Logging Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL || "http://localhost:5000" }));
app.use(cookieParser());

// ✅ Body Parsers
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
app.use(tenantMiddleware);

// Static Files (public assets)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoute); // Authentication-related routes (login, signup, etc.)
app.use('/users', userRoute); // User-specific routes (profile, settings, etc.)
app.use('/subscriptions', subscriptionRoute); // Subscription routes (upgrade, plan change)
app.use('/page-access', pageAccessRoute); // Routes for page access (admin, user)
app.use('/password-reset', passwordResetRoutes);

// Health Check Route (optional)
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running smoothly' });
});

// Error handling middleware
app.use(errorLogger); // Logs errors in the app

// Start the server
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);

  // Test DB connection and sync models
  await testConnection();
  await syncModels(); // Sync the DB with the models
});
