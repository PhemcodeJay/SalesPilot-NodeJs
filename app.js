require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const cors = require('cors');

const { verifyToken } = require('./config/auth');
const paypalClient = require('./config/paypalconfig');
const tenancy = require('./middleware/tenancyMiddleware');
const asyncHandler = require('./middleware/asyncHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { checkAndDeactivateSubscriptions } = require('./controllers/subscriptioncontroller');
const { getTenantDatabase } = require('./config/db');
const tenantService = require('./services/tenantservices');
const { OrdersCreateRequest } = require('@paypal/checkout-server-sdk');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Passport Configuration
require('./config/passport')(passport);

// ✅ Middleware Setup (Corrected Order)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Must be before session
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Enable CORS (Before CSRF)
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL, // Ensure this is set in .env
  })
);

// ✅ Session Middleware (Before Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'strict' },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ✅ Tenancy and Rate Limiting Middleware
app.use(tenancy);
app.use(rateLimiter);

// ✅ CSRF Middleware (After CORS, Session, and Passport)
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// ✅ Middleware to send CSRF token to frontend
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), { httpOnly: false, secure: process.env.NODE_ENV === 'production' });
  res.locals.csrfToken = req.csrfToken();
  next();
});

// ✅ View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Serve Static Files
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// ✅ Routes Import
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

const formRoutes = require('./routes/formRoutes');

// ✅ Use Routes
app.use('/', formRoutes);
Object.entries(routes).forEach(([name, route]) => {
  app.use(`/${name}`, route);
});

// ✅ Home Route
app.get('/', (req, res) => {
  res.render('home/index', { title: 'Home', csrfToken: req.csrfToken() });
});

// ✅ PayPal Payment Route
app.post(
  '/create-payment',
  verifyToken,
  asyncHandler(async (req, res) => {
    try {
      const order = {
        intent: 'CAPTURE',
        purchase_units: [{ amount: { value: req.body.amount } }],
        application_context: {
          return_url: `${process.env.BASE_URL}/payment-success`,
          cancel_url: `${process.env.BASE_URL}/payment-cancel`,
        },
      };

      const request = new OrdersCreateRequest();
      request.requestBody(order);
      const orderResponse = await paypalClient.execute(request);
      res.json({ orderId: orderResponse.result.id });
    } catch (error) {
      console.error('❌ PayPal Error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  })
);

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Sync Databases for Tenants
async function syncDatabases() {
  try {
    const tenants = await tenantService.getAllTenants();
    if (!tenants.length) return console.log('⚠️ No tenants found. Skipping sync.');

    console.log(`🔄 Syncing ${tenants.length} tenant databases...`);
    await Promise.all(
      tenants.map(async (tenant) => {
        try {
          const { sequelize } = await getTenantDatabase(tenant.dbName);
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

// ✅ Start the Server
(async function startServer() {
  await syncDatabases();
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
})();

module.exports = app;
