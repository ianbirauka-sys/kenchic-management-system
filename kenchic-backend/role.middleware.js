const { sendError } = require('../utils/response.utils');

// Usage: roleMiddleware('employee')  or  roleMiddleware('customer', 'employee')
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access denied. You do not have permission to perform this action.', 403);
    }

    next();
  };
};

module.exports = roleMiddleware;