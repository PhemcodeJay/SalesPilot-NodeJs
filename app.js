require('dotenv').config(); // Must be at the very top
require('./cron/SubscriptionCron'); // 📅 Load and schedule the monthly subscription cron job
require('./cron/cleanupJobs');

const { Sequelize } = require('sequelize'); // Import Sequelize for DB connection
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const initializeJwtStrategy = require('./middleware/passportJwtStrategy');
const flash = require('connect-flash');
const { testConnection, syncModels, closeAllConnections, getTenantDb } = require('./config/db'); // Import functions from db.js
const rateLimiter = require('./middleware/rateLimiter');
const tenantMiddleware = require('./middleware/tenantMiddleware');
const authenticateUser = require('./middleware/authenticateUser');
const errorLogger = require('./middleware/errorLogger');

const authRoute = require('./routes/authRoutes');
const passwordResetRoutes = require('./routes/passwordresetRoute');

const app = express();
const port = process.env.PORT || 5000;


// ✅ Security & Logging Middleware
app.use(helmet());
app.use(morgan('dev'));

// ✅ CORS & Cookie Parsing
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL || 'http://localhost:5000'
}));
app.use(cookieParser());

// ✅ Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Rate Limiting
app.use(rateLimiter);

// ✅ Session Management
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

// ✅ Passport Initialization
app.use(passport.initialize());
initializeJwtStrategy(passport);
app.use(passport.session());
app.use(flash());

// ✅ View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Static Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/home_assets', express.static(path.join(__dirname, 'public/home_assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ✅ Tenant Middleware (must be early to bind req.tenantId)
app.use(tenantMiddleware);

// ✅ Public Pages
app.get('/', (req, res) => res.render('home/index', { title: 'Home' }));
app.get('/home', (req, res) => res.render('home/index', { title: 'Home' }));
app.get('/login', (req, res) => res.render('auth/login', { title: 'Login' }));
app.get('/logout', (req, res) => res.render('auth/logout', { title: 'Logout' }));
app.get('/signup', (req, res) => res.render('auth/signup', { title: 'Signup' }));
app.get('/terms', (req, res) => res.render('public/terms', { title: 'Terms' }));
app.get('/help', (req, res) => res.render('public/help', { title: 'Help' }));

// ✅ Routes
app.use('/auth', authRoute);
app.use('/password-reset', passwordResetRoutes);

// ✅ Protected Routes
const protectedRoutes = [
  '/dashboard',
  '/invoice',
  '/sales',
  '/expenses',
  '/product',
  '/customer',
  '/inventory',
  '/profile-subscription',
  '/staff',
  '/supplier',
  '/category',
  '/report',
  '/analysis',
];
protectedRoutes.forEach((route) => app.use(route, authenticateUser));

// ✅ Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running smoothly' });
});

// ✅ Error Logger
app.use(errorLogger);


// 🔍 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested route ${req.originalUrl} was not found on this server.`,
  });
});

// ✅ Global Error Handler (only ONE!)
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error('💥 Unexpected Error:', err.stack || message);

  // Check if client expects JSON (API call)
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({
      error: 'Internal Server Error',
      message,
    });
  }

  // Otherwise, render error page
  res.status(statusCode).render('error', {
    title: 'Error',
    statusCode,
    message,
  });
});

// ✅ Health-check route (optional redundancy)
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});



// ✅ Start the server and initialize DBs
app.listen(port, async () => {
  console.log(`🚀 SalesPILOT Server v${process.env.npm_package_version} running at http://localhost:${port}`);
  console.log(`🛠️  Environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // 🔄 Database Initialization Sequence
    await initializeDatabases();
    console.log('🌈 All databases initialized successfully');
    
    // Additional startup tasks can go here
    await initializeBackgroundServices();
    
  } catch (err) {
    console.error(`❌ Fatal startup error: ${err.message}`);
    console.error(err.stack);
    process.exit(1); // Exit with error code
  }
});

/**
 * Initializes all databases (main and tenants)
 */
async function initializeDatabases() {
  // 🔗 Main Database Initialization
  try {
    console.time('🕒 Main DB initialization');
    await testConnection();
    await syncModels({ alter: process.env.NODE_ENV !== 'production' });
    console.timeEnd('🕒 Main DB initialization');
    console.log('✅ Main (Admin) DB: Connected & Models Synced');
  } catch (err) {
    throw new Error(`Main DB initialization failed: ${err.message}`);
  }

  // 📦 Tenant Databases Initialization
  const defaultTenants = process.env.DEFAULT_TENANT_DB
    ? process.env.DEFAULT_TENANT_DB.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  if (defaultTenants.length > 0) {
    console.log(`🔍 Initializing ${defaultTenants.length} tenant databases...`);
    
    await Promise.allSettled(defaultTenants.map(async (tenantName) => {
      try {
        console.time(`🕒 Tenant DB ${tenantName} initialization`);
        await ensureTenantDatabase(tenantName);
        console.timeEnd(`🕒 Tenant DB ${tenantName} initialization`);
      } catch (err) {
        console.error(`⚠️  Tenant DB '${tenantName}' initialization failed:`, err.message);
        // Don't throw here to allow other tenants to initialize
      }
    }));
    
    // Verify all tenants initialized successfully
    const failedTenants = defaultTenants.filter(tenantName => {
      return !tenantDbCache.has(tenantName);
    });
    
    if (failedTenants.length > 0) {
      console.warn(`⚠️  ${failedTenants.length} tenant(s) failed to initialize:`, failedTenants);
    }
  }
}

/**
 * Ensures a tenant database exists and is properly initialized
 * @param {string} tenantName 
 */
async function ensureTenantDatabase(tenantName) {
  try {
    // First try to connect normally
    const tenantDb = getTenantDb(tenantName);
    await testTenantConnection(tenantName);
    await syncTenantModels(tenantName, { 
      alter: process.env.NODE_ENV !== 'production' 
    });
    console.log(`✅ Tenant DB '${tenantName}': Connected & Synced`);
  } catch (initialError) {
    if (initialError.message.includes('Unknown database')) {
      // Database doesn't exist, create it
      console.log(`🛠️  Tenant DB '${tenantName}' not found. Creating...`);
      await createTenantDatabase(tenantName);
      
      // Verify creation was successful
      const tenantDb = getTenantDb(tenantName);
      await testTenantConnection(tenantName);
      await syncTenantModels(tenantName, { force: false });
      console.log(`🎉 Tenant DB '${tenantName}' created and initialized`);
    } else {
      throw initialError;
    }
  }
}

/**
 * Creates a new tenant database with proper schema
 * @param {string} tenantName 
 */
async function createTenantDatabase(tenantName) {
  const adminSequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    pool: { max: 1 } // Single connection for admin operations
  });

  try {
    // Verify database doesn't already exist
    const [results] = await adminSequelize.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, 
      { replacements: [tenantName] }
    );

    if (results.length > 0) {
      console.log(`ℹ️  Tenant DB '${tenantName}' already exists`);
      return;
    }

    // Create database with UTF8MB4 encoding for full Unicode support
    await adminSequelize.query(`CREATE DATABASE \`${tenantName}\` 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    console.log(`🛠️  Created tenant DB '${tenantName}'`);

    // Apply baseline privileges if using separate DB users
    if (process.env.TENANT_DB_USER) {
      await adminSequelize.query(
        `GRANT ALL PRIVILEGES ON \`${tenantName}\`.* TO ?@'%'`,
        { replacements: [process.env.TENANT_DB_USER] }
      );
      console.log(`🔑 Granted privileges to ${process.env.TENANT_DB_USER}`);
    }

  } catch (err) {
    console.error(`❌ Tenant DB creation failed for '${tenantName}':`, err.message);
    throw new Error(`Could not create tenant DB: ${err.message}`);
  } finally {
    await adminSequelize.close();
  }
}

/**
 * Initialize background services after DBs are ready
 */
async function initializeBackgroundServices() {
  // Example: Start your background workers, message queues, etc.
  if (process.env.ENABLE_BACKGROUND_WORKERS === 'true') {
    console.log('🔄 Starting background workers...');
    // Initialize your background services here
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM. Gracefully shutting down...');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT. Gracefully shutting down...');
  await closeAllConnections();
  process.exit(0);
});
