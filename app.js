const express = require('express');
const path = require('path');
const { getTenantDatabase } = require('./config/db'); // Import function to get tenant DB
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('./config/auth');
const paypalClient = require('./config/paypalconfig');
require('dotenv').config();
require('./config/passport')(passport);
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const tenancy = require('./middleware/tenancyMiddleware'); // Middleware for tenancy handling
const asyncHandler = require('./middleware/asyncHandler');
const rateLimiter = require('./middleware/rateLimiter');
const cron = require('node-cron'); // Cron job package
const { checkAndDeactivateSubscriptions } = require('./controllers/subscriptioncontroller');
const PORT = process.env.PORT || 5000;

// Import routes
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

// Initialize Express App
const app = express();

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apply tenancy middleware to set the tenant's database dynamically
app.use(tenancy);

// Apply global rate limiter
app.use(rateLimiter);

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Files
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/home_assets', express.static(path.join(__dirname, 'public', 'home_assets')));

// Attach imported routes dynamically
Object.entries(routes).forEach(([name, route]) => {
  app.use(`/${name}`, route);
});

// Home Route
app.get('/', (req, res) => {
  res.render('home/index', { title: 'Home' });
});

// PayPal Payment Example
app.post('/create-payment', verifyToken, asyncHandler(async (req, res) => {
  const order = {
    intent: 'CAPTURE',
    purchase_units: [{ amount: { value: req.body.amount } }],
    application_context: {
      return_url: 'http://localhost:5000/payment-success',
      cancel_url: 'http://localhost:5000/payment-cancel',
    },
  };

  const request = new paypalClient.orders.OrdersCreateRequest();
  request.requestBody(order);

  const orderResponse = await paypalClient.execute(request);
  res.json({ orderId: orderResponse.result.id });
}));

// Example Route with asyncHandler
app.get(
  '/api/example',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: 'Hello, World!' });
  })
);

// Global Error Handler for Non-existent Routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Run Initial Cron Job
cron.schedule('* * * * *', async () => {
  console.log('Running initial subscription check...');
  try {
    await checkAndDeactivateSubscriptions();
    console.log('Initial subscription check completed.');
  } catch (error) {
    console.error('Error during initial subscription check:', error.message);
  }
});

// Scheduled Cron Job (Runs at midnight daily)
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily subscription check...');
  try {
    await checkAndDeactivateSubscriptions();
    console.log('Expired subscriptions deactivated successfully.');
  } catch (error) {
    console.error('Error during daily subscription check:', error.message);
  }
});

// Define the global database name (or fetch it from environment variables)
const GLOBAL_DB_NAME = process.env.GLOBAL_DB_NAME || 'global_database';

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Example of dynamically selecting tenant database
  const tenantDbName = 'tenant_db_example'; // You should dynamically get the tenant DB name
  const { mysqlPDO, sequelize } = getTenantDatabase(tenantDbName);
  console.log(`Tenant database connected: ${tenantDbName}`);

  // Additional startup logic if required
});

module.exports = app;
