const firebaseHelper = require('../utils/firebaseHelper');
const emailService = require('../services/email.service');
const { ApiError } = require('../middlewares/error.middleware');

const settingsController = {
  /**
   * Retrieves all configuration settings
   */
  async getSettings(req, res, next) {
    try {
      const settings = await firebaseHelper.get('settings') || {
        smtp: {},
        company: {},
        sender: {},
        followup: { delay3: 3, delay7: 4, delay14: 7 },
        campaignDefaults: {},
        webhooks: {}
      };

      // Ensure webhooks is present in returned data even if not stored yet
      if (!settings.webhooks) {
        settings.webhooks = {};
      }

      res.status(200).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Updates settings nodes.
   * Path: req.params.section -> 'smtp' | 'company' | 'sender' | 'followup' | 'campaignDefaults' | 'webhooks'
   */
  async updateSettingsSection(req, res, next) {
    try {
      const { section } = req.params;
      const validSections = ['smtp', 'company', 'sender', 'followup', 'campaignDefaults', 'webhooks'];

      if (!validSections.includes(section)) {
        throw new ApiError(400, `Invalid settings section: ${section}. Must be one of ${validSections.join(', ')}`);
      }

      if (section === 'smtp') {
        const isConnected = await emailService.testSmtpConnection(req.body);
        if (!isConnected) {
          throw new ApiError(400, 'SMTP connection verification failed. Please verify the host, port, username, and password credentials.');
        }
      }

      const updated = await firebaseHelper.update(`settings/${section}`, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: `Settings section [${section}] updated successfully`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Triggers a live verification test for SMTP settings (using custom settings in body or DB values)
   */
  async testSmtpSettings(req, res, next) {
    try {
      let smtpConfig = req.body;

      // If no config passed, pull from saved settings in database
      if (!smtpConfig || Object.keys(smtpConfig).length === 0) {
        smtpConfig = await firebaseHelper.get('settings/smtp');
      }

      if (!smtpConfig || !smtpConfig.host) {
        throw new ApiError(400, 'SMTP configuration is missing. Provide configuration or save settings first.');
      }

      const isConnected = await emailService.testSmtpConnection(smtpConfig);

      if (isConnected) {
        return res.status(200).json({
          success: true,
          message: 'SMTP Hostinger connection verified successfully.',
          data: { connected: true }
        });
      } else {
        throw new ApiError(500, 'SMTP connection verification failed. Check configuration values.');
      }
    } catch (error) {
      next(error);
    }
  }
};

module.exports = settingsController;
