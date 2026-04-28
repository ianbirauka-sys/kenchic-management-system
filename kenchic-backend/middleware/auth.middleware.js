const { verifyToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'No token provided. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token. Please log in again.', 401);
  }
};

module.exports = authMiddleware;