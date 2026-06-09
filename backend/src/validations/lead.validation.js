const Joi = require('joi');

const INDUSTRIES = [
  'Dental', 'Gym', 'Restaurant', 'Real Estate', 'Hotel',
  'Construction', 'Ecommerce', 'Retail', 'Salon', 'Clinic',
  'Education', 'Finance', 'Manufacturing', 'Logistics',
  'SaaS', 'Startup', 'IT Agency', 'Other'
];

const STATUSES = [
  'New', 'Contacted', 'Opened', 'Clicked', 'Replied',
  'Interested', 'Closed', 'Unsubscribed'
];

const createLead = Joi.object({
  name: Joi.string().required().trim().max(100),
  email: Joi.string().email().required().trim().lowercase(),
  phone: Joi.string().allow('', null).trim(),
  company: Joi.string().allow('', null).trim(),
  industry: Joi.string().valid(...INDUSTRIES).default('Other'),
  city: Joi.string().allow('', null).trim(),
  status: Joi.string().valid(...STATUSES).default('New')
});

const updateLead = Joi.object({
  name: Joi.string().trim().max(100),
  email: Joi.string().email().trim().lowercase(),
  phone: Joi.string().allow('', null).trim(),
  company: Joi.string().allow('', null).trim(),
  industry: Joi.string().valid(...INDUSTRIES),
  city: Joi.string().allow('', null).trim(),
  status: Joi.string().valid(...STATUSES)
});

const bulkImport = Joi.array().items(createLead);

module.exports = {
  createLead,
  updateLead,
  bulkImport,
  INDUSTRIES,
  STATUSES
};
