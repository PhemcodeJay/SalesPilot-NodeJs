const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const LocalStrategy = require("passport-local").Strategy;
const bcryptUtils = require("../utils/bcryptUtils"); // Assuming bcrypt utility functions are defined
const { Op } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config(); // ✅ Load environment variables

/**
 * Initialize Passport authentication strategies
 * @param {object} passport - Passport instance
 * @param {object} models - Database models
 */
module.exports = (passport, models) => {
    if (!models || !models.User) {
        console.error("❌ Error: User model not initialized in Passport setup.");
        return;
    }

    const { User } = models; // ✅ Ensure User model is available

    // ✅ JWT Authentication Strategy
    const jwtOpts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
    };

    passport.use(
        new JwtStrategy(jwtOpts, async (payload, done) => {
            try {
                const user = await User.findOne({
                    where: {
                        [Op.or]: [
                            { id: payload.id },
                            { email: payload.email },
                            { username: payload.username },
                        ],
                    },
                });

                if (user) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: "Invalid token" });
                }
            } catch (error) {
                console.error("❌ Error in Passport JWT Strategy:", error.message);
                return done(error, false);
            }
        })
    );

    // ✅ Local Authentication Strategy (Accepts Email or Username & Password)
    passport.use(
        new LocalStrategy(
            {
                usernameField: "identifier", // Can be email or username
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
                        return done(null, false, { message: "User not found" });
                    }

                    // ✅ Check if user is active (for login validation)
                    if (!user.is_active) {
                        return done(null, false, { message: "Account not activated. Check your email." });
                    }

                    // ✅ Compare password using bcryptUtils (hash comparison)
                    const isMatch = await bcryptUtils.comparePassword(password, user.password);
                    if (!isMatch) {
                        return done(null, false, { message: "Incorrect password" });
                    }

                    return done(null, user);
                } catch (error) {
                    console.error("❌ Error in Passport Local Strategy:", error.message);
                    return done(error);
                }
            }
        )
    );

    // ✅ Serialize user ID into session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // ✅ Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findByPk(id);
            done(null, user);
        } catch (error) {
            console.error("❌ Error in deserializeUser:", error.message);
            done(error);
        }
    });

    console.log("✅ Passport strategies initialized successfully.");
};
