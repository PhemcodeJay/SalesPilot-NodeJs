// middleware/passportJwtStrategy.js

const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { models } = require('../config/db'); // Import models from db.js
const { User } = models;  // Access the User model from loaded models
const dotenv = require('dotenv');

dotenv.config();

module.exports = (passport) => {
  const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
      token = req.cookies.token;  // Extract JWT from HTTP-only cookie
    }
    return token;
  };

  const options = {
    jwtFromRequest: cookieExtractor,  // Use cookie extractor to fetch token
    secretOrKey: process.env.JWT_SECRET,  // Use JWT secret from environment
  };

  passport.use(
    new JwtStrategy(options, async (jwt_payload, done) => {
      try {
        const user = await User.findByPk(jwt_payload.id);  // Fetch user based on JWT payload
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        if (user.status !== 'active') {
          return done(null, false, { message: 'User account not activated' });
        }

        return done(null, user);  // Successfully authenticated user
      } catch (err) {
        console.error('Passport JWT error:', err);
        return done(err, false);  // Handle any errors
      }
    })
  );
};
