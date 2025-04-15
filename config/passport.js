const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Setup Passport local strategy for login (username or email)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'usernameOrEmail', // We use this custom field to accept either username or email
      passwordField: 'password',
    },
    async (usernameOrEmail, password, done) => {
      try {
        // Dynamically load the User model after Sequelize is initialized
        const { User } = require('../models'); // Dynamically load the User model

        // Find user by either email or username
        const user = await User.findOne({
          where: {
            [Op.or]: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
          },
        });

        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Successful authentication
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user to store user information in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (userId, done) => {
  try {
    // Dynamically load the User model after Sequelize is initialized
    const { User } = require('../models'); // Dynamically load the User model

    // Find the user by ID and return user object
    const user = await User.findByPk(userId);
    if (!user) {
      return done(new Error('User not found'), null);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Setup JWT strategy for token-based authentication
passport.use(
  'jwt',
  new passport.Strategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: req => req.cookies['access_token'], // Assuming token is stored in cookies
    },
    async (jwtPayload, done) => {
      try {
        // Dynamically load the User model after Sequelize is initialized
        const { User } = require('../models'); // Dynamically load the User model

        // Find user by ID from JWT payload
        const user = await User.findByPk(jwtPayload.id);
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

// Generate JWT Token
const generateJWT = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = passport;
