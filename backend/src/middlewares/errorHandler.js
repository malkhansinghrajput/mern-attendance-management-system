const logger = require('../config/logger');
const { sendError } = require('../utils/response');

/**
 * Global error handler middleware.
 * Must be registered LAST in app.js (after all routes).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the error (never log sensitive user data)
  logger.error(`${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, 'DUPLICATE_KEY', `${field} already exists`);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 400, 'INVALID_ID', 'Invalid resource ID format');
  }

  // Use error's own status/code if available (thrown by services)
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message;

  return sendError(res, status, code, message);
};

module.exports = { errorHandler };
