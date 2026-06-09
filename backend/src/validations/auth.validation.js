const Joi = require('joi');

const register = Joi.object({
  name: Joi.string().required().trim().max(100),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Admin', 'Team Member').default('Team Member')
});

const login = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required()
});

const forgotPassword = Joi.object({
  email: Joi.string().email().required().trim().lowercase()
});

const resetPassword = Joi.object({
  password: Joi.string().min(6).required()
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
