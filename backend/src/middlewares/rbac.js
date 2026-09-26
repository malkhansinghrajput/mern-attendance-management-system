const { sendError } = require('../utils/response');
const { ERROR_CODES } = require('../constants/errors');

/**
 * RBAC middleware factory.
 * Returns a middleware that allows only the specified roles.
 *
 * Usage: authorize('admin', 'manager')
 *
 * NOTE: authenticate() must run before authorize() in the middleware chain.
 * Frontend hiding buttons is NOT authorization — every endpoint enforces this.
 *
 * @param {...string} roles - Allowed role strings
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, ERROR_CODES.UNAUTHORIZED, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        `Access denied. Required roles: ${roles.join(', ')}`
      );
    }
    next();
  };
};

module.exports = { authorize };
