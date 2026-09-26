const jwt = require('jsonwebtoken');

/**
 * Signs a JWT token with userId and role payload.
 * @param {string} userId
 * @param {string} role
 * @returns {string} signed token
 */
const signToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Verifies and decodes a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { signToken, verifyToken };
