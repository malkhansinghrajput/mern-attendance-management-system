const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');
const { ERROR_CODES } = require('../constants/errors');

/**
 * Middleware to handle express-validator errors.
 * Must be placed after validator chains in the route definition.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return sendError(
      res,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      details
    );
  }
  next();
};

module.exports = { validate };
