const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'your_jwt_secret';

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };
