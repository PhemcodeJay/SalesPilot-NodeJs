const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs"); // Ensure bcrypt is installed
const dotenv = require("dotenv");
const db = require("../models"); // Replace with actual ORM model import

dotenv.config(); // Load environment variables

module.exports = (passport) => {
    // JWT Authentication Strategy
    const jwtOpts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
    };

    passport.use(
        new JwtStrategy(jwtOpts, async (payload, done) => {
            try {
                // Fetch user using either ID or email
                const user = await db.User.findOne({
                    where: {
                        [db.Sequelize.Op.or]: [{ id: payload.id }, { email: payload.email }],
                    },
                });

                if (user) return done(null, user);
                return done(null, false);
            } catch (error) {
                console.error("❌ Error in Passport JWT Strategy:", error);
                return done(error, false);
            }
        })
    );

    // Local Authentication Strategy (Email & Password)
    passport.use(
        new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
            try {
                const user = await db.User.findOne({ where: { email } });
                if (!user) return done(null, false, { message: "User not found" });

                // Compare hashed password
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return done(null, false, { message: "Incorrect password" });

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        })
    );

    // Serialize user ID into session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await db.User.findByPk(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};
