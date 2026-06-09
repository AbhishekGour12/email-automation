const Joi = require('joi');

const CAMPAIGN_STATUSES = ['Draft', 'Running', 'Paused', 'Completed', 'Failed'];

const createCampaign = Joi.object({
  name: Joi.string().required().trim().max(100),
  templateId: Joi.string().required(),
  leadIds: Joi.array().items(Joi.string()).min(1), // Optional list of pre-assigned lead IDs
  settings: Joi.object({
    senderName: Joi.string().allow('', null),
    senderEmail: Joi.string().email().allow('', null),
    smtpSettings: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().integer().required(),
      secure: Joi.boolean().default(true),
      user: Joi.string().required(),
      pass: Joi.string().required()
    }).allow(null)
  }).default()
});

const updateCampaign = Joi.object({
  name: Joi.string().trim().max(100),
  status: Joi.string().valid(...CAMPAIGN_STATUSES),
  templateId: Joi.string(),
  leadIds: Joi.array().items(Joi.string())
});

module.exports = {
  createCampaign,
  updateCampaign,
  CAMPAIGN_STATUSES
};
