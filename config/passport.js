const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

module.exports = (passport, models) => {
    if (!models || !models.User) {
        console.error("❌ Error: User model not initialized in Passport setup.");
        return;
    }

    const { User } = models; // ✅ Ensure the User model is available

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

                if (user) return done(null, user);
                return done(null, false, { message: "Invalid token" });
            } catch (error) {
                console.error("❌ Error in Passport JWT Strategy:", error);
                return done(error, false);
            }
        })
    );

    // ✅ Local Authentication Strategy (Email or Username & Password)
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

                    if (!user) return done(null, false, { message: "User not found" });

                    // Compare passwords using bcrypt
                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch) return done(null, false, { message: "Incorrect password" });

                    return done(null, user);
                } catch (err) {
                    console.error("❌ Error in passport authentication:", err);
                    return done(err);
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
            done(error);
        }
    });

    console.log("✅ Passport strategies initialized.");
};
