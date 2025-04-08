const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const LocalStrategy = require("passport-local").Strategy;
const bcryptUtils = require("../utils/bcryptUtils");
const { Op } = require("sequelize");
require("dotenv").config();

// Ensure JWT secret is defined
if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables.");
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Initialize Passport authentication strategies
 * @param {object} passport - Passport instance
 * @param {object} models - Sequelize models
 */
module.exports = (passport, models) => {
  if (!models || !models.User) {
    console.error("❌ Error: User model not initialized in Passport setup.");
    return;
  }

  const { User } = models;

  // ✅ JWT Strategy
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
      try {
        const user = await User.findOne({
          where: {
            [Op.or]: [
              { id: jwtPayload.id },
              { email: jwtPayload.email },
              { username: jwtPayload.username },
            ],
          },
        });

        if (user) return done(null, user);
        return done(null, false, { message: "Token invalid or user not found." });
      } catch (err) {
        console.error("❌ Passport JWT Strategy error:", err.message);
        return done(err, false);
      }
    })
  );

  // ✅ Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "identifier", // Accepts email or username
        passwordField: "password",
      },
      async (identifier, password, done) => {
        try {
          const user = await User.findOne({
            where: {
              [Op.or]: [{ email: identifier }, { username: identifier }],
            },
          });

          if (!user) {
            return done(null, false, { message: "User not found." });
          }

          if (!user.is_active) {
            return done(null, false, {
              message: "Account not activated. Check your email.",
            });
          }

          const isMatch = await bcryptUtils.comparePassword(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }

          return done(null, user);
        } catch (err) {
          console.error("❌ Passport Local Strategy error:", err.message);
          return done(err);
        }
      }
    )
  );

  // ✅ Sessions (optional if using session-based auth)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (err) {
      console.error("❌ deserializeUser error:", err.message);
      done(err);
    }
  });

  console.log("✅ Passport strategies initialized successfully.");
};
