require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const { verifyToken } = require('./config/auth');
const paypalClient = require('./config/paypalconfig');
const tenancy = require('./middleware/tenancyMiddleware');
const asyncHandler = require('./middleware/asyncHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { checkAndDeactivateSubscriptions } = require('./controllers/subscriptioncontroller');
const { getAllTenants, getTenantDatabase } = require('./config/db');
const tenantService = require('./services/tenantservices');
const { OrdersCreateRequest } = require('@paypal/checkout-server-sdk');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Passport Configuration
require('./config/passport')(passport);

// ✅ Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Session Middleware (Required for CSRF & Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }, // Secure only in production
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(tenancy);
app.use(rateLimiter);

// ✅ CSRF Middleware (After Session & Before Routes)
const csrfProtection = csrf();
app.use(csrfProtection);

// ✅ Pass CSRF Token to Views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// ✅ View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Serve Static Files
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/home_assets', express.static(path.join(__dirname, 'public', 'home_assets')));

// ✅ Routes Import
const routes = {
  auth: require('./routes/authRoute'),
  dashboard: require('./routes/dashboardRoute'),
  supplier: require('./routes/supplierRoute'),
  invoice: require('./routes/invoiceRoute'),
  sales: require('./routes/salesRoute'),
  categoryReport: require('./routes/category-reportRoute'),
  productReport: require('./routes/product-reportRoute'),
  product: require('./routes/productRoute'),
  chart: require('./routes/chartRoute'),
  chartReport: require('./routes/chart-reportRoute'),
  category: require('./routes/categoryRoute'),
  customer: require('./routes/customerRoute'),
  expense: require('./routes/expenseRoute'),
  inventory: require('./routes/inventoryRoute'),
  notification: require('./routes/notificationRoute'),
  pageAccess: require('./routes/page-accessRoute'),
  pay: require('./routes/payRoute'),
  profile: require('./routes/userRoute'),
  staff: require('./routes/staffRoute'),
  subscription: require('./routes/subscriptionRoute'),
  pdf: require('./routes/pdfRoute'),
};

// ✅ Attach Imported Routes Dynamically
Object.entries(routes).forEach(([name, route]) => {
  app.use(`/${name}`, route);
});

// ✅ Home Route
app.get('/', (req, res) => {
  res.render('home/index', { title: 'Home' });
});

// ✅ PayPal Payment Route
app.post(
  '/create-payment',
  verifyToken,
  asyncHandler(async (req, res) => {
    const order = {
      intent: 'CAPTURE',
      purchase_units: [{ amount: { value: req.body.amount } }],
      application_context: {
        return_url: `${process.env.BASE_URL}/payment-success`,
        cancel_url: `${process.env.BASE_URL}/payment-cancel`,
      },
    };

    try {
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

// ✅ Example API Route
app.get(
  '/api/example',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: 'Hello, World!' });
  })
);

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

/**
 * ✅ Sync Databases for All Tenants
 */
async function syncDatabases() {
  try {
    const tenants = await tenantService.getAllTenants();
    if (!tenants.length) {
      console.log('⚠️ No tenants found. Skipping database sync.');
      return;
    }

    console.log(`🔄 Starting database sync for ${tenants.length} tenants...`);

    const syncResults = await Promise.allSettled(
      tenants.map(async (tenant) => {
        try {
          const { sequelize } = await getTenantDatabase(tenant.dbName);
          await sequelize.sync({ alter: true });
          console.log(`✅ Database synced for tenant: ${tenant.dbName}`);
        } catch (error) {
          console.error(`❌ Error syncing database for tenant ${tenant.dbName}:`, error.message);
          throw error;
        }
      })
    );

    const failedSyncs = syncResults.filter(result => result.status === 'rejected');
    if (failedSyncs.length) {
      console.warn(`⚠️ ${failedSyncs.length} tenant databases failed to sync.`);
    } else {
      console.log('✅ All tenant databases synced successfully.');
    }
  } catch (error) {
    console.error('❌ Critical error syncing databases:', error.message);
  }
}

// ✅ Initial Subscription Check
(async function () {
  try {
    console.log('🔄 Running initial subscription check on server startup...');
    await checkAndDeactivateSubscriptions();
    console.log('✅ Initial subscription check completed.');
  } catch (error) {
    console.error('❌ Error during initial subscription check:', error.message);
  }
})();

// ✅ Start the Server
(async function startServer() {
  await syncDatabases(); // Run database sync before starting the server
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
})();

module.exports = app;
