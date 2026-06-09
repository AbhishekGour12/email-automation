const { ApiError } = require('./error.middleware');

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    return next();
  }
  return next(new ApiError(403, 'Forbidden. Admin role required to perform this action.'));
};

module.exports = adminMiddleware;
