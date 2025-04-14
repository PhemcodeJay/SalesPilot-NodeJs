const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');

const { testConnection, syncModels } = require('./config/db');
const rateLimiter = require('./middleware/rateLimiter');
const tenantMiddleware = require('./middleware/tenantMiddleware');
const authenticateUser = require('./middleware/authenticateUser');
const errorLogger = require('./middleware/errorLogger');

const authRoute = require('./routes/authRoutes');
const passwordResetRoutes = require('./routes/passwordresetRoute');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ Security & Logging Middleware
app.use(helmet());
app.use(morgan('dev'));

// ✅ CORS & Cookie Parsing
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL || 'http://localhost:5000' }));
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
app.use(passport.session());
app.use(flash());

// ✅ View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/home_assets', express.static(path.join(__dirname, 'public/home_assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ✅ Tenancy Middleware (must come before routes using req.tenantId)
app.use(tenantMiddleware);

// ✅ Public View Routes
app.get('/', (req, res) => res.render('home/index', { title: 'Home' }));
app.get('/home', (req, res) => res.render('home/index', { title: 'Home' }));
app.get('/login', (req, res) => res.render('auth/login', { title: 'Login' }));
app.get('/signup', (req, res) => res.render('auth/signup', { title: 'Signup' }));

// ✅ Route Setup
app.use('/auth', authRoute);
app.use('/password-reset', passwordResetRoutes);

// ✅ Protected Routes (apply custom authentication middleware)
const protectedRoutes = [
  '/dashboard',
  '/invoice',
  '/sales',
  '/expenses',
  '/product',
  '/customer',
  '/inventory',
  '/subscription',
];

protectedRoutes.forEach((route) => app.use(route, authenticateUser));

// ✅ Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running smoothly' });
});

// ✅ Error Logging
app.use(errorLogger);

// ✅ Start Server
app.listen(port, async () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);

  await testConnection();
  await syncModels(); // Sync models to DB
});
  
