const emailService = require('../services/email.service');
const firebaseHelper = require('../utils/firebaseHelper');
const { logger } = require('../utils/logger');
const { ApiError } = require('../middlewares/error.middleware');

const emailController = {
  /**
   * Tracks email open and returns transparent 1x1 pixel gif
   */
  async trackOpen(req, res, next) {
    const { emailId } = req.params;
    logger.info(`Open tracked for email ID: ${emailId}`);

    try {
      const email = await firebaseHelper.get(`emails/${emailId}`);
      if (email) {
        // Update email open stats if not already opened
        if (!email.openedAt) {
          await firebaseHelper.update(`emails/${emailId}`, {
            openedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // Update lead status to Opened (only if lead is currently Contacted or New)
          const lead = await firebaseHelper.get(`leads/${email.leadId}`);
          if (lead && (lead.status === 'Contacted' || lead.status === 'New')) {
            await firebaseHelper.update(`leads/${email.leadId}`, {
              status: 'Opened',
              updatedAt: new Date().toISOString()
            });
          }

          // Update campaign analytics
          await emailService.incrementCampaignAnalytics(email.campaignId, 'openCount');
        }
      }
    } catch (err) {
      logger.error(`Error tracking email open for email ID ${emailId}:`, err);
    }

    // Serve 1x1 pixel gif
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(pixel);
  },

  /**
   * Tracks click and redirects user to target URL
   */
  async trackClick(req, res, next) {
    const { emailId } = req.params;
    const targetUrl = req.query.url;
    logger.info(`Click tracked for email ID: ${emailId}, target: ${targetUrl}`);

    try {
      if (!targetUrl) {
        throw new ApiError(400, 'Redirect target URL is missing.');
      }

      const email = await firebaseHelper.get(`emails/${emailId}`);
      if (email) {
        // Auto-track open if they click a link but open tracking was blocked by email client
        if (!email.openedAt) {
          await firebaseHelper.update(`emails/${emailId}`, {
            openedAt: new Date().toISOString()
          });

          // Update lead status to Opened (only if lead is currently Contacted or New)
          const lead = await firebaseHelper.get(`leads/${email.leadId}`);
          if (lead && (lead.status === 'Contacted' || lead.status === 'New')) {
            await firebaseHelper.update(`leads/${email.leadId}`, {
              status: 'Opened',
              updatedAt: new Date().toISOString()
            });
          }

          // Update campaign analytics for open
          await emailService.incrementCampaignAnalytics(email.campaignId, 'openCount');
        }

        // Update email click stats if not already clicked
        if (!email.clickedAt) {
          await firebaseHelper.update(`emails/${emailId}`, {
            clickedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // Update lead status to Clicked (if currently New, Contacted, or Opened)
          const lead = await firebaseHelper.get(`leads/${email.leadId}`);
          const currentStatus = lead?.status;
          if (lead && (currentStatus === 'New' || currentStatus === 'Contacted' || currentStatus === 'Opened')) {
            await firebaseHelper.update(`leads/${email.leadId}`, {
              status: 'Clicked',
              updatedAt: new Date().toISOString()
            });
          }

          // Update campaign analytics
          await emailService.incrementCampaignAnalytics(email.campaignId, 'clickCount');
        }
      }
    } catch (err) {
      logger.error(`Error tracking click for email ID ${emailId}:`, err);
    }

    // Always redirect to the target URL (even if database lookup failed)
    if (targetUrl) {
      return res.redirect(targetUrl);
    }
    res.status(400).send('Invalid redirect link.');
  },

  /**
   * Sends a single email to an arbitrary lead or specific address (mainly for testing/individual sends)
   */
  async sendSingleEmail(req, res, next) {
    try {
      const { leadId, campaignId, subject, body } = req.body;
      
      const result = await emailService.sendOutreachEmail({
        leadId,
        campaignId,
        template: { subject, body }
      });

      if (!result.success) {
        throw new ApiError(500, `Email send failed: ${result.error}`);
      }

      res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieves log logs of all outreach emails
   */
  async listEmailHistory(req, res, next) {
    try {
      const emails = await firebaseHelper.get('emails') || {};
      const emailsList = Object.values(emails);
      
      // Sort by newest first
      emailsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.status(200).json({
        success: true,
        message: 'Email history retrieved successfully',
        data: emailsList
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = emailController;
