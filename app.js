const express = require('express');
const path = require('path');
const { sequelize } = require('./config/db'); // Import Sequelize configuration (global DB)
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
const cron = require('node-cron');  // Importing cron job package

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
  pdfRoute: require('./routes/pdfRoute'),
};

// Initialize Express App
const app = express();

// Middleware Setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Use the tenancy middleware to resolve the tenant from the subdomain or URL
app.use(tenancy);

// Apply global rate limiter
app.use(rateLimiter);

// Session Configuration (Ensure it's correctly placed before any passport usage)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }, // Set to true if HTTPS is enabled in production
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Flash messaging middleware
app.use(flash());

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Files
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/home_assets', express.static(path.join(__dirname, 'public', 'home_assets')));

// Middleware to handle setting tenant info based on the request
app.use(async (req, res, next) => {
  const tenantId = req.headers['tenant-id']; // Assume tenant is passed in headers or subdomains
  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant ID is required.' });
  }

  // Get tenant-specific database configuration
  const { mysqlPDO, sequelize } = require('./config/db').getTenantDatabase(tenantId);

  // Attach the tenant's database connections to the request for future use
  req.db = { mysqlPDO, sequelize };

  next();
});

// Routes to Serve Views
app.get('/', (req, res) => {
  res.render('home/index', { title: 'Home' });
});

// PayPal Payment Example
app.post('/create-payment', verifyToken, async (req, res) => {
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

  try {
    const orderResponse = await paypalClient.execute(request);
    res.json({ orderId: orderResponse.result.id });
  } catch (error) {
    console.error('PayPal Error:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});

// Attach the imported routes dynamically
Object.entries(routes).forEach(([name, route]) => {
  app.use(`/${name}`, route);
});

// Example route with asyncHandler
app.get(
  '/api/example',
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: 'Hello, World!' });
  })
);

// Global error handler for non-existent routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


// Run cron job immediately when the server starts
cron.schedule('* * * * *', () => {
  console.log('Cron job triggered immediately on server startup!');
  // Add any tasks that should run when the server connects here
  // e.g., data cleanup, subscription reminders, etc.
});

// Scheduled Cron Job (Example: Runs at midnight every day)
cron.schedule('0 0 * * *', () => {
  console.log('Cron job running at midnight every day!');
  // Add your recurring cron tasks here (e.g., data cleanup, subscription reminders, etc.)
});


// Example of a route to fetch tenant details
app.get('/tenant', async (req, res) => {
  const tenantId = req.headers['tenant-id'];
  try {
    const Tenant = require('./models/tenant');
    const tenant = await Tenant.findOne({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tenant data.' });
  }
});

// Initialize Sequelize and check DB connection for the global DB
sequelize.authenticate()
  .then(() => console.log('Global database connected successfully'))
  .catch(err => console.error('Database connection error: ', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
