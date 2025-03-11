require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'defaultSecretKey'; // Default for dev mode only

/**
 * Generate JWT token for a user.
 * @param {Object} user - User object with at least `id` and `email`.
 * @param {string} [expiresIn='1h'] - Token expiration time.
 * @returns {string} - Signed JWT token.
 */
const generateToken = (user, expiresIn = '1h') => {
    const payload = {
        id: user.id,
        email: user.email,
    };
    return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

/**
 * Middleware to verify JWT token.
 * Supports `Authorization` header (Bearer Token) and `x-auth-token` header.
 */
const verifyToken = (req, res, next) => {
    // Only verify the token if in production environment
    if (process.env.NODE_ENV === 'production') {
        const token =
            req.header('x-auth-token') || // Support x-auth-token header
            (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null); // Support Bearer Token

        if (!token) {
            return res.status(401).json({ message: 'Access denied, no token provided' });
        }

        try {
            // Verify the token with the secret key
            const decoded = jwt.verify(token, SECRET_KEY);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
    } else {
        // If not in production, skip token verification for testing
        next(); // Allow access to the protected route directly
    }
};

/**
 * Middleware to require authentication for protected routes.
 */
const requireAuth = (req, res, next) => {
    verifyToken(req, res, (err) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }
        next();
    });
};

module.exports = {
    generateToken,
    verifyToken,
    requireAuth,
};
