require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { verifyToken } = require('./config/auth');
const paypalClient = require('./config/paypalconfig');
const { authenticateUser } = require('./middleware/auth');
const tenancyMiddleware = require('./middleware/tenancyMiddleware');
const asyncHandler = require('./middleware/asyncHandler');
const { checkAndDeactivateSubscriptions } = require('./controllers/subscriptioncontroller');
const { getTenantDatabase } = require('./config/db');
const tenantService = require('./services/tenantservices');
const { OrdersCreateRequest } = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');
const rateLimiter = require('./middleware/rateLimiter');

// ✅ Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Load Passport Configuration
require('./config/passport')(passport);

// ✅ Middleware Setup
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL || 'http://localhost:5000' }));
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
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ Initialize Passport & Flash Messages
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ✅ Apply Authentication Middleware (Excluding Public Routes)
app.use(authenticateUser);
app.use(tenancyMiddleware);

// ✅ View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Serve the entire 'public' folder (best practice)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Explicitly serve 'assets' and 'home_assets' if needed
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use("/home_assets", express.static(path.join(__dirname, "public/home_assets")));


// ✅ Define Public Routes (No Authentication Needed)
app.get("/", (req, res) => {
  res.render("home/index", { title: "Home" });
});

// ✅ Protected Test Route
app.use("/protected-route", authenticateUser, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

// ✅ Import & Apply Routes
const routes = {
  auth: require('./routes/authRoute'),
  dashboard: require('./routes/dashboardRoute'),
  invoice: require('./routes/invoiceRoute'),
  sales: require('./routes/salesRoute'),
  product: require('./routes/productRoute'),
  customer: require('./routes/customerRoute'),
  inventory: require('./routes/inventoryRoute'),
  subscription: require('./routes/subscriptionRoute'),
};

Object.entries(routes).forEach(([name, route]) => {
  try {
    if (route) {
      app.use(`/${name}`, route);
    } else {
      console.error(`❌ Route '${name}' is undefined! Check your route imports.`);
    }
  } catch (error) {
    console.error(`❌ Error loading route '${name}':`, error);
  }
});

// ✅ 404 Error Handling
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Sync Tenant Databases
async function syncDatabases() {
  try {
    const tenants = await tenantService.getAllTenants();
    if (!tenants.length) return console.log('⚠️ No tenants found. Skipping sync.');

    console.log(`🔄 Syncing ${tenants.length} tenant databases...`);
    await Promise.all(
      tenants.map(async (tenant) => {
        try {
          const { sequelize } = await getTenantDatabase(tenant.id);
          await sequelize.sync({ alter: true });
          console.log(`✅ Synced: ${tenant.dbName}`);
        } catch (error) {
          console.error(`❌ Sync failed for ${tenant.dbName}:`, error.message);
        }
      })
    );
  } catch (error) {
    console.error('❌ Critical database sync error:', error.message);
  }
}

// ✅ Initial Subscription Check
(async function () {
  try {
    console.log('🔄 Checking subscriptions...');
    await checkAndDeactivateSubscriptions();
    console.log('✅ Subscription check complete.');
  } catch (error) {
    console.error('❌ Subscription check error:', error.message);
  }
})();

// ✅ Start Server
(async function startServer() {
  await syncDatabases();
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
})();

module.exports = app;
