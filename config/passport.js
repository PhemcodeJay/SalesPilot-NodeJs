require('dotenv').config(); // Load environment variables first

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Load User model dynamically to avoid circular deps
const getUserModel = () => require('./db').models.User;

// ==============================
// 🔐 Local Strategy for Login
// ==============================
passport.use(
  new LocalStrategy(
    {
      usernameField: 'usernameOrEmail',
      passwordField: 'password',
    },
    async (usernameOrEmail, password, done) => {
      try {
        const User = getUserModel();
        const user = await User.findOne({
          where: {
            [Op.or]: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
          },
        });

        if (!user) return done(null, false, { message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: 'Invalid credentials' });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// ==============================
// 🧠 Session Handling
// ==============================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const User = getUserModel();
    const user = await User.findByPk(id);
    if (!user) return done(new Error('User not found'), null);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ==============================
// 🔑 JWT Strategy (From Cookie)
// ==============================
passport.use(
  new JwtStrategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.access_token || null,
      ]),
    },
    async (jwtPayload, done) => {
      try {
        const User = getUserModel();
        const user = await User.findByPk(jwtPayload.id);
        if (!user) return done(null, false, { message: 'User not found' });
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

// ==============================
// 🔧 Token Generators
// ==============================

const generateJWT = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    tokenType: 'refresh',
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const verifyRefreshToken = (token) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tokenType !== 'refresh') throw new Error('Invalid refresh token');
    return payload;
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }
};

// ==============================
// 📤 Export
// ==============================
module.exports = {
  passport,
  generateJWT,
  generateRefreshToken,
  verifyRefreshToken,
};
