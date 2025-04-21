const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');  // Import the User model at the top

// Setup Passport local strategy for login (username or email)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'usernameOrEmail', // Custom field to accept either username or email
      passwordField: 'password',
    },
    async (usernameOrEmail, password, done) => {
      try {
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
    const user = await User.findByPk(userId);
    if (!user) {
      return done(new Error('User not found'), null);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Setup JWT strategy for token-based authentication using passport-jwt
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

passport.use(
  new JwtStrategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req.cookies['access_token'], // Extract from cookies
      ]),
    },
    async (jwtPayload, done) => {
      try {
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
