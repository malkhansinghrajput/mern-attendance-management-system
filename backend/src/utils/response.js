/**
 * Sends a standardized success response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable success message
 * @param {object} data - Response payload
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends a standardized error response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Machine-readable error code (from ERROR_CODES)
 * @param {string} message - Human-readable error message
 * @param {array} details - Optional validation details
 */
const sendError = (res, statusCode = 500, code = 'INTERNAL_ERROR', message = 'Something went wrong', details = []) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
    },
  });
};

module.exports = { sendSuccess, sendError };
