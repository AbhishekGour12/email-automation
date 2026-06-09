const { ApiError } = require('./error.middleware');

/**
 * Validates request payload against Joi schema
 * @param {object} schema - Joi validation schema
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { value, error } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map((details) => details.message.replace(/['"]/g, ''))
        .join(', ');
      return next(new ApiError(400, errorMessage));
    }

    // Replace request data with parsed/validated value
    req[source] = value;
    return next();
  };
};

module.exports = validate;
