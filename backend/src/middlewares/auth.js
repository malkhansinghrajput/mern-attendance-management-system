const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const { sendError } = require('../utils/response');
const { ERROR_CODES } = require('../constants/errors');
const logger = require('../config/logger');

/**
 * Middleware: Verifies JWT from Authorization header.
 * Sets req.user on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, ERROR_CODES.UNAUTHORIZED, 'Authentication token is required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return sendError(res, 401, ERROR_CODES.UNAUTHORIZED, 'User not found or deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, ERROR_CODES.TOKEN_EXPIRED, 'Session expired. Please login again');
    }
    logger.warn(`Auth middleware error: ${error.message}`);
    return sendError(res, 401, ERROR_CODES.AUTHENTICATION_FAILED, 'Invalid authentication token');
  }
};

module.exports = { authenticate };
